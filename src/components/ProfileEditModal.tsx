"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  userId: string;
  initialName?: string | null;
  initialDob?: string | null; // ISO date string
  onClose: () => void;
}

export default function ProfileEditModal({
  userId,
  initialName,
  initialDob,
  onClose,
}: Props) {
  const [fullName, setFullName] = useState(initialName || "");
  const [dateOfBirth, setDateOfBirth] = useState(initialDob || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset fields when initial values change (should happen once)
  useEffect(() => {
    setFullName(initialName || "");
    setDateOfBirth(initialDob || "");
  }, [initialName, initialDob]);

  const handleSave = async () => {
    setError("");
    if (!dateOfBirth) {
      setError("Date of birth is required to calculate your age.");
      return;
    }
    setSaving(true);
    try {
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          full_name: fullName || null,
          date_of_birth: dateOfBirth,
        },
        { onConflict: "id" },
      );
      if (upsertError) throw upsertError;
      onClose();
    } catch (e) {
      setError("Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Edit Profile</h2>
        <p className="text-sm text-gray-500 mb-5">
          Update your name and date of birth. This is used to provide consistent
          results.
        </p>

        <label className="block mb-3">
          <span className="text-xs font-semibold text-gray-600">Full name</span>
          <input
            type="text"
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>

        <label className="block mb-5">
          <span className="text-xs font-semibold text-gray-600">
            Date of birth
          </span>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </label>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
