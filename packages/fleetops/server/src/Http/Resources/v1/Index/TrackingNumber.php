<?php

namespace Fleetbase\FleetOps\Http\Resources\v1\Index;

use Fleetbase\Http\Resources\FleetbaseResource;

class TrackingNumber extends FleetbaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @param \Illuminate\Http\Request $request
     *
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id'              => $this->when($this->id, $this->id),
            'uuid'            => $this->when($this->uuid, $this->uuid),
            'public_id'       => $this->when($this->public_id, $this->public_id),
            'tracking_number' => $this->when($this->tracking_number, $this->tracking_number),
            'region'          => $this->region,
            'subject'         => \Fleetbase\FleetOps\Support\Utils::get($this->owner, 'public_id'),
            'owner'           => $this->whenLoaded('owner', function () {
                return [
                    'uuid'      => $this->owner->uuid,
                    'public_id' => $this->owner->public_id,
                ];
            }),
            'status'          => $this->last_status,
            'qr_code'         => $this->when($this->qr_code, $this->qr_code),
        ];
    }
}
