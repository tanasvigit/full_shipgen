<?php

namespace Fleetbase\Http\Requests;

class TestMailboxEmailRequest extends FleetbaseRequest
{
    /**
     * Any authenticated console user may send a mailbox test to their own email.
     */
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'mailbox' => 'required|string|in:support,billing',
        ];
    }
}
