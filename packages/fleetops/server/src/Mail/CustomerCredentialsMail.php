<?php

namespace Fleetbase\FleetOps\Mail;

use Fleetbase\FleetOps\Models\Contact;
use Fleetbase\FleetOps\Support\Utils;
use Fleetbase\Mail\Concerns\RendersVelocityMailable;
use Fleetbase\Mail\Support\CredentialEmailBranding;
use Fleetbase\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomerCredentialsMail extends Mailable
{
    use Queueable;
    use RendersVelocityMailable;
    use SerializesModels;

    private string $plaintextPassword;

    private Contact $customer;

    public function __construct(string $plaintextPassword, Contact $customer)
    {
        $this->plaintextPassword = $plaintextPassword;
        $this->customer          = $customer;
    }

    public function envelope(): Envelope
    {
        $this->customer->loadMissing('company');

        return $this->velocityCredentialEnvelope('fleetops.customer-credentials', $this->templateVariables());
    }

    public function content(): Content
    {
        return $this->velocityContent('fleetops.customer-credentials', $this->templateVariables());
    }

    /**
     * @return array<string, mixed>
     */
    protected function templateVariables(): array
    {
        $user = $this->customer->getUser();
        $timezone = CredentialEmailBranding::resolveTimezone(
            data_get($user, 'timezone'),
            data_get($this->customer, 'timezone') ?? data_get($this->customer->company, 'timezone')
        );

        return [
            'brandName' => CredentialEmailBranding::BRAND_NAME,
            'headerTagline' => 'Command Center · Customer Portal',
            'logoUrl' => CredentialEmailBranding::emailLogoUrl(),
            'headline' => CredentialEmailBranding::greetingHeadline($this->customer->name, $timezone),
            'customerName' => $this->customer->name,
            'userEmail' => data_get($user, 'email'),
            'plaintextPassword' => $this->plaintextPassword,
            'companyName' => data_get($this->customer->company, 'name'),
            'customerPortalUrl' => $this->getCustomerPortalAccessUrl(),
        ];
    }

    private function getCustomerPortalAccessUrl(): ?string
    {
        $customerPortalConfig = Setting::lookupFromCompany('customer-portal-config');
        $accessUrlSlug        = data_get($customerPortalConfig, 'accessUrlSlug');

        return $accessUrlSlug ? Utils::consoleUrl($accessUrlSlug) : null;
    }
}
