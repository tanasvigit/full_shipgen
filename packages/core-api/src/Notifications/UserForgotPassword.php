<?php

namespace Fleetbase\Notifications;

use Fleetbase\Mail\Concerns\RendersVelocityEmail;
use Fleetbase\Models\VerificationCode;
use Fleetbase\Support\Utils;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserForgotPassword extends Notification implements ShouldQueue
{
    use Queueable;
    use RendersVelocityEmail;

    /**
     * Instance of the verification code for the password reset.
     */
    public ?VerificationCode $verificationCode;

    /**
     * The URL where the user can reset their password.
     */
    public string $url;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct(?VerificationCode $verificationCode, ?string $url = null)
    {
        $this->verificationCode = $verificationCode;
        $this->url              = $url ?? Utils::consoleUrl('auth/reset-password/' . $verificationCode->uuid, ['code' => $verificationCode->code]);
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @return MailMessage
     */
    public function toMail($notifiable)
    {
        return $this->velocityMail('auth.password-reset', [
            'notifiableName' => $notifiable->name,
            'code' => $this->verificationCode->code,
            'resetUrl' => $this->url,
        ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'code' => $this->verificationCode->code,
        ];
    }
}
