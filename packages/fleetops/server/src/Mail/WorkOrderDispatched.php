<?php

namespace Fleetbase\FleetOps\Mail;

use Fleetbase\FleetOps\Models\WorkOrder;
use Fleetbase\Mail\Concerns\RendersVelocityMailable;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkOrderDispatched extends Mailable
{
    use Queueable;
    use RendersVelocityMailable;
    use SerializesModels;

    public WorkOrder $workOrder;

    public function __construct(WorkOrder $workOrder)
    {
        $this->workOrder = $workOrder;
    }

    public function envelope(): Envelope
    {
        return $this->velocityEnvelope('fleetops.work-order-dispatched', $this->templateVariables());
    }

    public function content(): Content
    {
        return $this->velocityContent('fleetops.work-order-dispatched', $this->templateVariables());
    }

    /**
     * @return array<string, mixed>
     */
    protected function templateVariables(): array
    {
        $subject = 'Work Order #' . $this->workOrder->public_id;
        if ($this->workOrder->subject) {
            $subject .= ': ' . $this->workOrder->subject;
        }

        $target = $this->workOrder->target;

        return [
            'emailSubject' => $subject,
            'workOrderPublicId' => $this->workOrder->public_id,
            'workOrderSubjectLine' => $this->workOrder->subject,
            'assigneeName' => data_get($this->workOrder->assignee, 'name'),
            'workOrderStatus' => ucfirst(str_replace('_', ' ', (string) $this->workOrder->status)),
            'workOrderPriority' => ucfirst((string) $this->workOrder->priority),
            'targetName' => data_get($target, 'name') ?? data_get($target, 'display_name') ?? data_get($target, 'public_id'),
            'dueAt' => $this->workOrder->due_at?->format('d M Y'),
            'estimatedCost' => $this->workOrder->estimated_cost
                ? number_format($this->workOrder->estimated_cost / 100, 2) . ' ' . strtoupper($this->workOrder->currency ?? 'USD')
                : null,
            'approvedBudget' => $this->workOrder->approved_budget
                ? number_format($this->workOrder->approved_budget / 100, 2) . ' ' . strtoupper($this->workOrder->currency ?? 'USD')
                : null,
            'instructions' => $this->workOrder->instructions,
        ];
    }
}
