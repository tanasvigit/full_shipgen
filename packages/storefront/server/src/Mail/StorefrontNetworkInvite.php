<?php

namespace Fleetbase\Storefront\Mail;

use Fleetbase\FleetOps\Support\Utils;
use Fleetbase\Mail\Concerns\RendersVelocityMailable;
use Fleetbase\Models\Invite;
use Fleetbase\Models\User;
use Fleetbase\Storefront\Models\Network;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StorefrontNetworkInvite extends Mailable
{
    use Queueable;
    use RendersVelocityMailable;
    use SerializesModels;

    public Invite $invite;
    public Network $network;
    public User $sender;
    public string $url;

    public function __construct(Invite $invite)
    {
        $this->invite  = $invite;
        $this->network = $this->invite->subject;
        $this->sender  = $this->invite->createdBy;
        $this->url     = Utils::consoleUrl('join/network/' . $this->invite->uri);
    }

    public function envelope(): Envelope
    {
        return $this->velocityEnvelope('storefront.network-invite', $this->templateVariables());
    }

    public function content(): Content
    {
        return $this->velocityContent('storefront.network-invite', $this->templateVariables());
    }

    /**
     * @return array<string, mixed>
     */
    protected function templateVariables(): array
    {
        return [
            'networkName' => $this->network->name,
            'senderName' => $this->sender->name,
            'inviteUrl' => $this->url,
        ];
    }
}
