<?php

namespace Fleetbase\Notifications;

use Fleetbase\Mail\Concerns\RendersVelocityEmail;
use Fleetbase\Models\Company;
use Fleetbase\Models\User;
use Fleetbase\Support\Utils;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Class UserAcceptedCompanyInvite.
 *
 * Notification for when a user accepts an invitation to a company.
 */
class UserAcceptedCompanyInvite extends Notification implements ShouldQueue
{
    use Queueable;
    use RendersVelocityEmail;

    /**
     * The company that the user has joined.
     */
    public Company $company;

    /**
     * The user who has accepted the invite.
     */
    public User $user;

    /**
     * The notification name.
     */
    public static string $name = 'User Accepted Company Invite';

    /**
     * The notification description.
     */
    public static string $description = 'Notification sent when a user has accepted a company invite.';

    /**
     * The notification package.
     */
    public static string $package = 'core';

    /**
     * Create a new notification instance.
     *
     * @param Company $company the company model instance
     * @param User    $user    the user model instance
     */
    public function __construct(Company $company, User $user)
    {
        $this->company = $company;
        $this->user    = $user;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param mixed $notifiable the notifiable entity
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
     * @param mixed $notifiable the notifiable entity
     *
     * @return MailMessage
     */
    public function toMail($notifiable)
    {
        return $this->velocityMail('auth.user-accepted-invite', [
            'userName' => $this->user->name,
            'companyName' => $this->company->name,
            'teamUrl' => Utils::consoleUrl('iam/users'),
        ], $this->company->uuid);
    }

    /**
     * Get the array representation of the notification.
     *
     * @param mixed $notifiable the notifiable entity
     *
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'company_id' => $this->company->id,
            'user_id'    => $this->user->id,
        ];
    }
}
