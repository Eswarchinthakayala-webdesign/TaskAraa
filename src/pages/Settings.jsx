import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";

export default function Settings() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load profile info
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      setEmail(user.email);

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setFullName(data.full_name || "");
      }
    };
    fetchProfile();
  }, [navigate]);

  // Save name
  const handleSaveName = async () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    if (error) toast.error(error.message);
    else toast.success("Name updated successfully");
  };

  // Change password
  const handleChangePassword = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated successfully");
      setShowPasswordFields(false);
      setPassword("");
      setConfirmPassword("");
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").delete().eq("id", user.id);

    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) toast.error("Failed to delete account: " + error.message);
    else {
      toast.success("Account deleted successfully");
      navigate("/login");
    }
  };

  return (
    <section className="min-h-screen  flex items-center justify-center bg-[#070720] text-white px-4">
        <Sidebar/>
      <motion.div
        className="w-full max-w-2xl bg-[#02021c] border border-blue-950  rounded-xl shadow-lg p-8"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

        {/* Email */}
        <div className="mb-5">
          <Label className="mb-1 block text-sm text-neutral-400">Email</Label>
          <Input
            value={email}
            readOnly
            className="bg-[#1e1e2f] border-neutral-700 text-neutral-300 cursor-not-allowed"
          />
        </div>

        {/* Full name */}
        <div className="mb-5">
          <Label className="mb-1 block text-sm text-neutral-400">Full Name</Label>
          <Input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="bg-[#1e1e2f] border-neutral-700 text-white"
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="mt-3 bg-[#1e1e2f] hover:bg-[#131320] cursor-pointer border border-neutral-600">
                Save Name
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Confirm Name Change</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to update your full name to "{fullName}"?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="hover:bg-gray-700 cursor-pointer hover:text-white">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    handleSaveName();
                    toast.info("Name change confirmed");
                  }}
                  className="bg-purple-600 cursor-pointer hover:bg-purple-700 hover:text-black"
                > 
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Change password toggle */}
        {!showPasswordFields && (
          <Button
            onClick={() => setShowPasswordFields(true)}
            className="bg-[#1e1e2f] hover:bg-[#131320] cursor-pointer border border-neutral-600 w-full"
          >
            Change Password
          </Button>
        )}

        {/* Change password fields */}
        {showPasswordFields && (
          <div className="mt-5">
            <div className="mb-4">
              <Label className="mb-1 block text-sm text-neutral-400">New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-[#1e1e2f] hover:bg-[#131320] cursor-pointer text-white"
              />
            </div>
            <div className="mb-5">
              <Label className="mb-1 block text-sm text-neutral-400">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-[#1e1e2f] hover:bg-[#131320] cursor-pointer border-neutral-700 text-white"
              />
            </div>
            <div className="flex gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-[#1e1e2f] hover:bg-[#131320] cursor-pointer border border-neutral-600 flex-1">
                    Save Password
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Confirm Password Change</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to change your password?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="text-black">
                    <AlertDialogCancel className="cursor-pointer hover:bg-gray-500" >Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        handleChangePassword();
                        toast.info("Password change confirmed");
                      }}
                      className="bg-red-600 hover:bg-red-700 cursor-pointer"
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                onClick={() => setShowPasswordFields(false)}
                className="border-neutral-600 text-black hover:bg-gray-700 hover:text-white hover:border-white cursor-pointer flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <hr className="my-6 border-neutral-700" />

        {/* Logout & Delete Account */}
        <div className="flex gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-[#1e1e2f] hover:bg-[#131320] cursor-pointer border border-neutral-600 flex-1">
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="hover:bg-gray-700 cursor-pointer hover:text-white">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    handleLogout();
                    toast.info("Logout confirmed");
                  }}
                  className="bg-red-600 cursor-pointer hover:bg-red-700"
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-red-700 hover:bg-red-800 text-white flex-1">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete Account</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="hover:bg-gray-700 cursor-pointer hover:text-white">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    handleDeleteAccount();
                    toast.info("Account deletion confirmed");
                  }}
                  className="bg-red-600 hover:bg-red-700 cursor-pointer"
                >
                  Yes, Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </section>
  );
}
