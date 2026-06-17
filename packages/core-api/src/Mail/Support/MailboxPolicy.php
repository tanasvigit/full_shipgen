<?php

namespace Fleetbase\Mail\Support;

use Illuminate\Mail\Mailables\Address;

class MailboxPolicy
{
    /**
     * @return array{from: Address, replyTo: Address|null, allowReplies: bool, mailbox: string}
     */
    public static function forTemplate(string $templateKey): array
    {
        $mailbox = self::mailboxForTemplate($templateKey);
        $allowReplies = self::allowsReplies($templateKey, $mailbox);

        return [
            'mailbox' => $mailbox,
            'allowReplies' => $allowReplies,
            'from' => self::address($mailbox),
            'replyTo' => $allowReplies ? self::address($mailbox) : null,
        ];
    }

    public static function address(string $mailbox): Address
    {
        $address = config("fleetbase.mailboxes.addresses.{$mailbox}");
        if (!is_string($address) || trim($address) === '') {
            $address = config('mail.from.address');
        }

        return new Address((string) $address, CredentialEmailBranding::BRAND_NAME);
    }

    protected static function mailboxForTemplate(string $templateKey): string
    {
        $exactMappings = (array) config('fleetbase.mailboxes.mapping.exact', []);
        $exact = $exactMappings[$templateKey] ?? null;
        if (is_string($exact) && $exact !== '') {
            return $exact;
        }

        $prefixes = (array) config('fleetbase.mailboxes.mapping.prefix', []);
        foreach ($prefixes as $prefix => $mailbox) {
            if (str_starts_with($templateKey, (string) $prefix)) {
                return (string) $mailbox;
            }
        }

        return (string) config('fleetbase.mailboxes.default', 'support');
    }

    protected static function allowsReplies(string $templateKey, string $mailbox): bool
    {
        $disabled = (array) config('fleetbase.mailboxes.no_reply_exact', []);
        if (in_array($templateKey, $disabled, true)) {
            return false;
        }

        $replyEnabledMailboxes = (array) config('fleetbase.mailboxes.reply_enabled_mailboxes', []);

        return in_array($mailbox, $replyEnabledMailboxes, true);
    }
}
