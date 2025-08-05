'use client'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import UserAvatar from "./UserAvatar";
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { upload } from "@imagekit/next"
import { ImageIcon } from "lucide-react"
import { uppdateProfilePicture } from "@/lib/api"
import toast from "react-hot-toast"


const UserProfile = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [renderedImage, setRenderedImage] = useState("");
    const dialogCloseRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (!selectedImage) return setRenderedImage("");
        const reader = new FileReader();
        reader.onload = (e) => setRenderedImage(e.target?.result as string);
        reader.readAsDataURL(selectedImage);
    }, [selectedImage]);
    const uploadToImageKit = async (file: File) => {
        const authRes = await fetch("/api/auth/imagekit-auth");
        const auth = await authRes.json();
        const publicKey = process.env.NEXT_PUBLIC_PUBLIC_KEY as string;
        console.log(publicKey);
        const result = await upload({
            file,
            fileName: file.name,
            publicKey: publicKey,
            signature: auth.signature,
            token: auth.token,
            expire: auth.expire,
            folder: "user-profile-images",
        });
        //console.log(result);
        return result; // usable image URL
    };
    const handleSubmit = async () => {
        try {
            const res = await uploadToImageKit(selectedImage!);
            const imageUrl = res.url;
            await uppdateProfilePicture(imageUrl as string);
            dialogCloseRef.current?.click();
            setSelectedImage(null);
            setRenderedImage("");
            toast.success("Profile picture updated successfully");
        } catch (error) {
            toast.error("Failed to update profile picture");
        }
    };
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button ><UserAvatar /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogClose ref={dialogCloseRef} />
                    <DialogTitle>Change your Profile picture</DialogTitle>
                    <DialogDescription>
                        Upload a new profile picture for your account.
                    </DialogDescription>
                </DialogHeader>
                {renderedImage && (
                    <div className="w-16 h-16 relative mx-auto">
                        <Image src={renderedImage} fill alt="Group Image" className="rounded-full object-cover" />
                    </div>
                )}
                <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="avatar-image-input"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                /> <Button
                    className="flex gap-2"
                    onClick={() => document.getElementById("avatar-image-input")?.click()}
                >
                    <ImageIcon size={20} />
                    Select Image
                </Button>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        disabled={!selectedImage}
                        onClick={handleSubmit}
                    >Upload Image</Button>
                </DialogFooter>
            </DialogContent>

        </Dialog>
    )
}

export default UserProfile