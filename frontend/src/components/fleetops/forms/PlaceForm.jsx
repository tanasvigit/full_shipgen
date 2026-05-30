import { forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormSection from "@/components/fleetops/FormSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { placeFormSchema } from "@/lib/fleetops/schemas";
import { PLACE_TYPES } from "@/lib/fleetops/constants";
import { useFormHandle } from "./formUtils";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

const defaultValues = {
  name: "",
  street1: "",
  street2: "",
  city: "",
  province: "",
  postalCode: "",
  country: "",
  phone: "",
  type: "pickup",
  openingHours: "",
  securityAccessCode: "",
  notes: "",
  latitude: "",
  longitude: "",
};

export function placeValuesFromApi(raw) {
  if (!raw) return { ...defaultValues };
  return {
    name: raw.name || "",
    street1: raw.street1 || raw.address || "",
    street2: raw.street2 || "",
    city: raw.city || "",
    province: raw.province || "",
    postalCode: raw.postal_code || "",
    country: raw.country || "",
    phone: raw.phone || "",
    type: raw.type || "pickup",
    openingHours: raw.opening_hours || "",
    securityAccessCode: raw.security_access_code || "",
    notes: raw.meta?.notes || "",
    latitude: raw.latitude ?? raw.location?.latitude ?? "",
    longitude: raw.longitude ?? raw.location?.longitude ?? "",
  };
}

const PlaceForm = forwardRef(function PlaceForm({ formId, initialValues }, ref) {
  const [geocoding, setGeocoding] = useState(false);
  const methods = useForm({
    resolver: zodResolver(placeFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });
  const { register, watch, setValue, formState: { errors } } = methods;
  useFormHandle(ref, methods);

  const geocodeAddress = async () => {
    const parts = [watch("street1"), watch("city"), watch("province"), watch("postalCode"), watch("country")].filter(Boolean);
    const query = parts.join(", ");
    if (!query.trim()) {
      toast.error("Enter an address first");
      return;
    }
    setGeocoding(true);
    try {
      const result = await fleetopsService.lookupPlace(query).catch(() => fleetopsService.geocodeQuery({ query }));
      const place = result?.place || result?.places?.[0] || result;
      const lat = place?.latitude ?? place?.lat ?? place?.location?.latitude;
      const lng = place?.longitude ?? place?.lng ?? place?.location?.longitude;
      if (lat != null && lng != null) {
        setValue("latitude", String(lat));
        setValue("longitude", String(lng));
        toast.success("Coordinates updated");
      } else {
        toast.error("No coordinates returned for this address");
      }
    } catch (err) {
      toast.error(err?.friendlyMessage || "Geocode failed");
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div id={formId} className="space-y-4" data-testid="place-form">
      <FormSection title="Location" testId="place-form-location">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-mono uppercase text-[#374151]">Place name</Label>
            <Input {...register("name")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="place-field-name" />
            {errors.name && <p className="text-xs text-[#B91C1C]">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-mono uppercase text-[#374151]">Street address</Label>
            <Input {...register("street1")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="place-field-street1" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">City</Label>
            <Input {...register("city")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="place-field-city" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">State / province</Label>
            <Input {...register("province")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="place-field-province" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Postal code</Label>
            <Input {...register("postalCode")} className="bg-[#F5F6F8] border-black/[0.08] font-mono" data-testid="place-field-postal" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Country (ISO2)</Label>
            <Input {...register("country")} maxLength={2} className="bg-[#F5F6F8] border-black/[0.08] uppercase" data-testid="place-field-country" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Type</Label>
            <Select value={watch("type")} onValueChange={(v) => setValue("type", v)}>
              <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08]" data-testid="place-field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Phone</Label>
            <Input {...register("phone")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="place-field-phone" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Operations & geocode" collapsible testId="place-form-ops">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Opening hours</Label>
            <Input {...register("openingHours")} placeholder="08:00-20:00" className="bg-[#F5F6F8] border-black/[0.08]" data-testid="place-field-hours" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Security / dock code</Label>
            <Input {...register("securityAccessCode")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="place-field-security" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="button" variant="outline" size="sm" disabled={geocoding} onClick={geocodeAddress} data-testid="place-geocode-button">
              <MapPin className="h-3.5 w-3.5 mr-1" /> {geocoding ? "Geocoding…" : "Geocode address"}
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Latitude</Label>
            <Input {...register("latitude")} className="bg-[#F5F6F8] border-black/[0.08] font-mono" data-testid="place-field-lat" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Longitude</Label>
            <Input {...register("longitude")} className="bg-[#F5F6F8] border-black/[0.08] font-mono" data-testid="place-field-lng" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-mono uppercase text-[#374151]">Notes</Label>
            <Textarea {...register("notes")} rows={2} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="place-field-notes" />
          </div>
        </div>
      </FormSection>
    </div>
  );
});

export default PlaceForm;
