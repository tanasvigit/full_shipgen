<?php

namespace Fleetbase\Mail;

use Fleetbase\Mail\Concerns\RendersVelocityMailable;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestMail extends Mailable
{
    use Queueable;
    use RendersVelocityMailable;
    use SerializesModels;

    public function envelope(): Envelope
    {
        return $this->velocityEnvelope('auth.mail-test', []);
    }

    public function content(): Content
    {
        return $this->velocityContent('auth.mail-test', []);
    }
}
