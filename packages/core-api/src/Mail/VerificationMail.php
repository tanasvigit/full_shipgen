<?php

namespace Fleetbase\Mail;

use Fleetbase\Mail\Concerns\RendersVelocityMailable;
use Fleetbase\Mail\Support\CredentialEmailBranding;
use Fleetbase\Models\VerificationCode;
use Fleetbase\Support\Utils;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerificationMail extends Mailable
{
    use Queueable;
    use RendersVelocityMailable;
    use SerializesModels;

    public VerificationCode $verificationCode;

    public ?string $content;

    public ?string $subjectOverride = null;

    public function __construct(VerificationCode $verificationCode, ?string $content = null, ?string $subjectOverride = null)
    {
        $this->verificationCode = $verificationCode;
        $this->content          = $content;
        $this->subjectOverride  = $subjectOverride;
    }

    public function envelope(): Envelope
    {
        return $this->velocityEnvelope(
            self::templateKeyFor($this->verificationCode->for),
            $this->templateVariables()
        );
    }

    public function content(): Content
    {
        return $this->velocityContent(
            self::templateKeyFor($this->verificationCode->for),
            $this->templateVariables()
        );
    }

    public static function templateKeyFor(string $for): string
    {
        return match ($for) {
            '2fa' => 'auth.verification-2fa',
            'storefront_create_customer' => 'storefront.verification-create-customer',
            'storefront_account_closure' => 'storefront.verification-account-closure',
            'registry_developer_account_verification' => 'registry.developer-verification',
            default => 'auth.verification',
        };
    }

    /**
     * @return array<string, mixed>
     */
    protected function templateVariables(): array
    {
        $user = $this->verificationCode->subject;
        $userName = Utils::delinkify(data_get($user, 'name', ''));

        return [
            'code' => $this->verificationCode->code,
            'userName' => $userName,
            'headline' => $userName !== ''
                ? CredentialEmailBranding::greetingHeadline($userName, data_get($user, 'timezone'))
                : 'Verify your email',
            'userEmail' => data_get($user, 'email', ''),
            'type' => $this->verificationCode->for,
            'contentOverride' => $this->content,
            'showVerifyButton' => $this->verificationCode->for === 'email_verification',
            'verifyUrl' => Utils::consoleUrl('onboard', [
                'step' => 'verify-email',
                'session' => base64_encode(data_get($user, 'uuid', '')),
                'code' => $this->verificationCode->code,
            ]),
            'subjectOverride' => $this->subjectOverride,
            'accountName' => data_get($user, 'name', ''),
            'accountEmail' => data_get($user, 'email', ''),
            'storeName' => data_get($this->verificationCode->meta, 'storefront_name', config('app.name')),
        ];
    }
}
