<?php

namespace Fleetbase\Http\Requests\Internal;

use Fleetbase\Http\Requests\FleetbaseRequest;
use Fleetbase\Rules\EmailDomainExcluded;
use Fleetbase\Rules\ValidPhoneNumber;
use Illuminate\Validation\Rule;

class UpdateOwnProfileRequest extends FleetbaseRequest
{
    public function authorize()
    {
        return (bool) $this->user();
    }

    protected function prepareForValidation(): void
    {
        $user = $this->input('user');
        if (is_array($user)) {
            $this->merge($user);
        }
    }

    public function rules()
    {
        $userId = $this->user()?->uuid;

        return [
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:100'],
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($userId, 'uuid')
                    ->whereNull('deleted_at'),
                new EmailDomainExcluded(),
            ],
            'phone' => [
                'sometimes',
                'nullable',
                new ValidPhoneNumber(),
                Rule::unique('users', 'phone')
                    ->ignore($userId, 'uuid')
                    ->whereNull('deleted_at'),
            ],
            'timezone' => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Name cannot be empty.',
            'name.min' => 'Name must be at least 2 characters.',
            'email.required' => 'Email address cannot be empty.',
            'email.email' => 'A valid email address is required.',
            'email.unique' => 'An account with this email address already exists.',
            'phone.unique' => 'An account with this phone number already exists.',
        ];
    }
}
