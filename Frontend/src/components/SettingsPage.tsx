import React from 'react';
import { auth, db } from "../firebase";
import { deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, Trash2, MessageSquareX, ClipboardX } from 'lucide-react';
import { deleteUserData, clearChatMessages, clearPlanMessages } from "../services/userService";

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

    // Frontend/src/components/SettingsPage.tsx
    const handleDeleteAccount = async () => {
        // 1. ถามเพื่อความแน่ใจรอบแรก
        const confirmFirst = window.confirm("คุณแน่ใจหรือไม่ที่จะลบบัญชี? การดำเนินการนี้ไม่สามารถย้อนกลับได้");
        if (!confirmFirst) return;

        // 2. บังคับให้พิมพ์ข้อความยืนยัน (ทำให้ลบยากขึ้นและต้องตั้งใจจริงๆ)
        const userInput = window.prompt("พิมพ์คำว่า 'DELETE' เพื่อยืนยันการลบบัญชีของคุณ:");

        if (userInput !== 'DELETE') {
            alert("คำยืนยันไม่ถูกต้อง การลบบัญชีถูกยกเลิก");
            return;
        }

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            console.log("Starting deletion process...");

            // 1. ลบข้อมูลใน Firestore
            await deleteUserData(currentUser.uid);
            console.log("Database deleted!");

            // 2. ลบบัญชี Authentication
            await deleteUser(currentUser);
            console.log("Auth account deleted!");

            alert("ลบบัญชีและข้อมูลทั้งหมดเรียบร้อยแล้ว");
            onLogout();
        } catch (error: any) {
            console.error("Error during deletion:", error.code);

            // กรณีล็อกอินไว้นานเกินไปจน Firebase ไม่อนุญาตให้ลบ (Security Policy)
            if (error.code === 'auth/requires-recent-login') {
                alert("เพื่อความปลอดภัย กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้งก่อนทำการลบบัญชี");
            } else {
                alert("เกิดข้อผิดพลาด: " + error.message);
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-4">
            <h2 className="text-3xl font-bold text-gray-800">Settings</h2>

            <Card className="border-indigo-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-indigo-50/30 border-b border-indigo-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquareX className="w-5 h-5 text-indigo-600" />
                        จัดการข้อมูลแชท
                    </CardTitle>
                    <CardDescription>ลบเฉพาะข้อความภายในแชทโดยไม่ลบบัญชี</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">ประวัติการแชท (AI Chat)</span>
                        <Button variant="outline" size="sm" onClick={handleClearChat} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                            ล้างแชท
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">ข้อความแผนงาน (Plan Messages)</span>
                        <Button variant="outline" size="sm" onClick={handleClearPlanMessages} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                            ล้างข้อความแผน
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-red-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-red-50/50 border-b border-red-100">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <CardTitle className="text-lg">Danger Zone</CardTitle>
                    </div>
                    <CardDescription className="text-red-700/70">
                        การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะถูกลบถาวร
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                        {/* แก้ไขส่วนนี้ใน SettingsPage.tsx */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-xl border border-red-50 shadow-sm gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 break-words">ลบบัญชีผู้ใช้</p>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            </div>

                            <Button
                                onClick={handleDeleteAccount}
                                className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-none px-6 font-bold transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
                                Delete Account
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}