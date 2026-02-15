import React from "react";
import { auth } from "../firebase";
import { deleteUser } from "firebase/auth";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  MessageSquare,
  AlertTriangle,
  Trash2,
  Settings as SettingsIcon,
  Mail,
  Database,
} from "lucide-react";
import {
  deleteUserData,
  clearChatMessages,
  clearPlanMessages,
} from "../services/userService";

interface SettingsPageProps {
  user: { uid: string; email: string };
  onLogout: () => void;
}

export function SettingsPage({ user, onLogout }: SettingsPageProps) {
  const handleClearChat = async () => {
    if (window.confirm("คุณต้องการลบประวัติการแชททั้งหมดใช่หรือไม่?")) {
      try {
        await clearChatMessages(user.uid);
        alert("ลบประวัติการแชทเรียบร้อยแล้ว");
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการลบแชท");
      }
    }
  };

  const handleClearPlanMessages = async () => {
    if (window.confirm("คุณต้องการลบข้อความแผนงานทั้งหมดใช่หรือไม่?")) {
      try {
        await clearPlanMessages(user.uid);
        alert("ลบข้อความแผนงานเรียบร้อยแล้ว");
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการลบข้อความแผนงาน");
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmFirst = window.confirm(
      "คุณแน่ใจหรือไม่ที่จะลบบัญชี? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
    );
    if (!confirmFirst) return;

    const userInput = window.prompt(
      "พิมพ์คำว่า 'DELETE' เพื่อยืนยันการลบบัญชีของคุณ:",
    );

    if (userInput !== "DELETE") {
      alert("คำยืนยันไม่ถูกต้อง การลบบัญชีถูกยกเลิก");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await deleteUserData(currentUser.uid);
      await deleteUser(currentUser);

      alert("ลบบัญชีและข้อมูลทั้งหมดเรียบร้อยแล้ว");
      onLogout();
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        alert(
          "เพื่อความปลอดภัย กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้งก่อนทำการลบบัญชี",
        );
      } else {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600 ml-14">
            Manage your account preferences and data
          </p>
        </div>

        {/* Account Info Card */}
        <Card className="border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader
            className="border-b bg-gradient-to-r from-slate-50 to-transparent"
            style={{ paddingTop: 10, paddingBottom: 10 }}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-xl">Account Information</CardTitle>
            </div>
            <CardDescription>Your current account details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6" style={{ paddingBottom: 20 }}>
            {/* เพิ่ม overflow-hidden เพื่อให้แน่ใจว่าไม่มีอะไรแลบออกไปนอก Card */}
            <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 min-w-0 overflow-hidden">
              {/* Icon: ใช้ flex-shrink-0 เพื่อไม่ให้วงกลมโดนเบียดจนเบี้ยว */}
              <div className="p-3 bg-indigo-600 rounded-full flex-shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>

              {/* Text Container: ต้องมี min-w-0 เพื่อให้ลูกข้างใน truncate ได้ */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500 font-medium">   
                  Email Address
                </p>
                {/* ใส่ truncate และดูให้แน่ใจว่า block/inline-block */}
                <p
                  className="text-lg font-semibold text-gray-900 truncate"
                  title={user.email}
                >
                  {user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management Card */}
        <Card className="border-indigo-200 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader
            className="bg-gradient-to-r from-indigo-50 to-transparent border-b border-indigo-100"
            style={{ paddingTop: 10, paddingBottom: 10 }}
          >
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-xl">Data Management</CardTitle>
            </div>
            <CardDescription>
              Clear your chat data without deleting your account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4" style={{ paddingBottom: 20 }}>
            <div className="group hover:shadow-md transition-all duration-200 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      AI Chat History
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Remove all conversation history with AI
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearChat}
                  className="sm:w-auto text-indigo-600 border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400 font-semibold transition-all shadow-sm"
                >
                  Clear Chat
                </Button>
              </div>
            </div>

            <div className="group hover:shadow-md transition-all duration-200 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Plan Messages</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Delete all messages related to your plans
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearPlanMessages}
                  className="sm:w-auto text-indigo-600 border-indigo-300 hover:bg-indigo-50 hover:border-indigo-400 font-semibold transition-all shadow-sm"
                >
                  Clear Messages
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-red-200 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader
            className="bg-gradient-to-r from-red-50 to-transparent border-b border-red-100"
            style={{ paddingTop: 10, paddingBottom: 10 }}
          >
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle className="text-xl">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-red-700/80">
              These actions are permanent and cannot be undone. All data will be
              permanently deleted.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6" style={{ paddingBottom: 20 }}>
            <div className="group hover:shadow-md transition-all duration-200 rounded-xl border-2 border-red-100 bg-gradient-to-br from-white to-red-50/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900">Delete Account</p>
                    <p className="text-sm text-gray-600 mt-0.5 break-all">
                      {user.email}
                    </p>
                    <p className="text-xs text-red-600 mt-1.5 font-medium">
                      ⚠️ This will permanently delete all your data
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleDeleteAccount}
                  className="sm:w-auto bg-red-600 hover:bg-red-700 text-white border-0 shadow-md font-bold transition-all active:scale-95 whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center py-4 text-sm text-gray-500">
          <p>Need help? Contact our support team for assistance.</p>
        </div>
      </div>
    </div>
  );
}
