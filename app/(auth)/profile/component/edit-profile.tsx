"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useState, useActionState, useEffect, useRef, useTransition } from "react";
import { LocationSelector, LocationValue } from "@/components/ui/location-selector";
import { updateProfileData } from "@/app/service/profile/profile.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/upload-image";

export function EditProfile({ data, onCancel }: any) {
  const { personal, address } = data;
  const router = useRouter();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [location, setLocation] = useState<LocationValue>({
    countryId: address.countryId || null,
    stateId: address.stateId || null,
    cityId: address.cityId || null,
    countryName: address.country !== "-" ? address.country : "",
    stateName: address.state !== "-" ? address.state : "",
    cityName: address.city !== "-" ? address.city : "",
    latitude: null,
    longitude: null
  });

  const [isUploading, setIsUploading] = useState(false);
  const [state, formAction, isPendingForm] = useActionState(updateProfileData, null);
  const [isPendingTrans, startTransition] = useTransition();
  const isSaving = isPendingForm || isPendingTrans || isUploading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.refresh();
      setTimeout(() => onCancel(), 500);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onCancel, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const file = formData.get("avatarFile") as File;
    if (file && file.size > 0 && file.name !== "undefined") {
      setIsUploading(true);
      const url = await uploadImage(file, "avatars");
      setIsUploading(false);

      if (url) {
        formData.append("avatarUrl", url);
      } else {
        toast.error("Gagal mengunggah foto profil baru.");
        return; // Hentikan jika gagal unggah
      }
    }

    formData.delete("avatarFile");

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Card className="animate-in fade-in mx-auto max-w-5xl duration-300">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="countryId" value={location.countryId || ""} />
          <input type="hidden" name="stateId" value={location.stateId || ""} />
          <input type="hidden" name="cityId" value={location.cityId || ""} />

          {/* Avatar Upload */}
          <div className="relative mx-auto w-fit">
            <Avatar className="h-24 w-24 border-2 border-slate-100 shadow-sm">
              <AvatarImage
                src={avatarPreview || data.profile.avatar}
                alt={personal.fullName}
                className="object-cover"
              />
              <AvatarFallback className="rounded-lg bg-orange-100/50 text-orange-700">
                {personal.fullName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              onClick={handleCameraClick}
              variant="default"
              className="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 p-0 text-white shadow-md hover:bg-blue-700"
              title="Ganti Foto Profil">
              <Camera className="h-4 w-4" />
            </Button>
            <input
              type="file"
              name="avatarFile"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Full Name</Label>
              <Input name="fullName" defaultValue={personal.fullName} />
            </div>

            <div>
              <Label>Nickname</Label>
              <Input name="nickname" defaultValue={personal.nickname} />
            </div>

            <div>
              <Label>Username</Label>
              <Input name="username" defaultValue={personal.username.replace("@", "")} />
            </div>

            <div className="opacity-70">
              <Label>Email</Label>
              <Input
                disabled
                value={personal.email}
                title="Email tidak dapat diganti"
                className="bg-slate-100"
              />
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input type="text" name="phone" defaultValue={personal.phone} />
            </div>

            <div>
              <Label>Date of Birth</Label>
              <Input type="date" name="birthDate" defaultValue={personal.isoBirthDate} />
            </div>

            <div>
              <Label>Grade</Label>
              <Select name="grade" defaultValue={personal.grade || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elementary School">Elementary School</SelectItem>
                  <SelectItem value="Junior High School">Junior High School</SelectItem>
                  <SelectItem value="Senior High School">Senior High School</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Organization/Institution</Label>
              <Input name="organization" defaultValue={personal.organization} />
            </div>

            <div>
              <Label>Gender</Label>
              <Select name="gender" defaultValue={personal.gender || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="mb-4 font-semibold text-slate-800">Address Location</h3>
            <div className="grid grid-cols-1 gap-6 align-top md:grid-cols-3">
              <LocationSelector
                value={location}
                onChange={setLocation}
                showDetectButton={false}
                showClearButton={true}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>

            <Button type="submit" disabled={isSaving} className="min-w-[100px]">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
