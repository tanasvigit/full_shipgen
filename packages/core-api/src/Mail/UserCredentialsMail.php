<?php

namespace Fleetbase\Mail;

use Fleetbase\Mail\Concerns\RendersVelocityMailable;
use Fleetbase\Mail\Support\CredentialEmailBranding;
use Fleetbase\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Fleetbase\Support\Utils;

class UserCredentialsMail extends Mailable
{
    use Queueable;
    use RendersVelocityMailable;
    use SerializesModels;

    private string $plaintextPassword;

    private User $user;

    public function __construct(string $plaintextPassword, User $user)
    {
        $this->plaintextPassword = $plaintextPassword;
        $this->user              = $user;
    }

    public function envelope(): Envelope
    {
        $this->user->loadMissing('company');

        return $this->velocityEnvelope('auth.user-credentials', $this->templateVariables());
    }

    public function content(): Content
    {
        return $this->velocityContent('auth.user-credentials', $this->templateVariables());
    }

    /**
     * @return array<string, mixed>
     */
    protected function templateVariables(): array
    {
        return [
            'brandName' => CredentialEmailBranding::BRAND_NAME,
            'headerTagline' => 'Command Center · Secure Access',
            'logoUrl' => CredentialEmailBranding::emailLogoUrl(),
            'headline' => CredentialEmailBranding::greetingHeadlineForUser($this->user),
            'userName' => Utils::delinkify($this->user->name),
            'userEmail' => $this->user->email,
            'plaintextPassword' => $this->plaintextPassword,
            'companyName' => $this->user->company_name,
        ];
    }
}
