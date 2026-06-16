<?php

namespace Fleetbase\FleetOps\Mail;

use Fleetbase\FleetOps\Models\MaintenanceSchedule;
use Fleetbase\Mail\Concerns\RendersVelocityMailable;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MaintenanceScheduleReminder extends Mailable
{
    use Queueable;
    use RendersVelocityMailable;
    use SerializesModels;

    public MaintenanceSchedule $schedule;

    public int $offsetDays;

    public function __construct(MaintenanceSchedule $schedule, int $offsetDays)
    {
        $this->schedule   = $schedule;
        $this->offsetDays = $offsetDays;
    }

    public function envelope(): Envelope
    {
        return $this->velocityEnvelope('fleetops.maintenance-reminder', $this->templateVariables());
    }

    public function content(): Content
    {
        return $this->velocityContent('fleetops.maintenance-reminder', $this->templateVariables());
    }

    /**
     * @return array<string, mixed>
     */
    protected function templateVariables(): array
    {
        $asset = $this->schedule->subject;
        $targetName = data_get($asset, 'name') ?? data_get($asset, 'display_name') ?? data_get($asset, 'public_id');

        return [
            'scheduleName' => $this->schedule->name,
            'targetName' => $targetName,
            'assigneeName' => data_get($this->schedule->defaultAssignee, 'name'),
            'reminderMessage' => $this->offsetDays === 1
                ? 'This is a reminder that the following maintenance is due tomorrow.'
                : "This is a reminder that the following maintenance is due in {$this->offsetDays} days.",
            'scheduleType' => ucfirst(str_replace('_', ' ', (string) $this->schedule->type)),
            'dueDate' => $this->schedule->next_due_date?->format('d M Y'),
            'intervalLabel' => $this->intervalLabel(),
            'priority' => ucfirst($this->schedule->default_priority ?? 'normal'),
            'instructions' => $this->schedule->instructions,
        ];
    }

    protected function intervalLabel(): string
    {
        return match ($this->schedule->interval_method) {
            'time' => 'Every ' . $this->schedule->interval_value . ' ' . $this->schedule->interval_unit,
            'odometer' => 'Every ' . number_format((float) $this->schedule->interval_distance) . ' km / miles',
            'engine_hours' => 'Every ' . number_format((float) $this->schedule->interval_engine_hours) . ' engine hours',
            default => '',
        };
    }
}
