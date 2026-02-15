import { doc, setDoc, serverTimestamp , writeBatch , collection , getDocs , updateDoc , deleteField} from "firebase/firestore";
import { db } from "../firebase";

export async function createUserDoc(user: any) {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    createdAt: serverTimestamp(),
  });
}

// ฟังก์ชันลบเฉพาะข้อความแชท
export const clearChatMessages = async (uid: string) => {
  const chatRef = doc(db, "chats", uid);
  await updateDoc(chatRef, {
    chatMessages: deleteField() // ลบฟิลด์ chatMessages ทิ้ง
  });
};

// ฟังก์ชันลบเฉพาะข้อความแผนงาน
export const clearPlanMessages = async (uid: string) => {
  const chatRef = doc(db, "chats", uid);
  await updateDoc(chatRef, {
    planMessages: deleteField() // ลบฟิลด์ planMessages ทิ้ง
  });
};

export const deleteUserData = async (uid: string) => {
  const batch = writeBatch(db);

  // 1. ลบ Chats ตามกฎ: match /chats/{userId}
  const chatRef = doc(db, "chats", uid);
  batch.delete(chatRef);

  // 2. ลบ BMI ตามกฎ: match /bmiRecords/{userId}/records/{recordId}
  const bmiSubRef = collection(db, "bmiRecords", uid, "records");
  const bmiSnapshot = await getDocs(bmiSubRef);
  bmiSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // 3. ลบ Workouts ตามกฎ: match /workouts/{userId}/records/{recordId}
  const workoutSubRef = collection(db, "workouts", uid, "records");
  const workoutSnapshot = await getDocs(workoutSubRef);
  workoutSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // 4. ลบ User Profile ตามกฎ: match /users/{userId}
  const userDocRef = doc(db, "users", uid);
  batch.delete(userDocRef);

  // ส่วนของ userPlans (ถ้ากฎไม่มี ให้อิงตามกฎทั่วไป /{document=**} ที่มีอยู่)
  const planRef = doc(db, "userPlans", uid);
  batch.delete(planRef);

  // ยืนยันการลบทั้งหมด
  await batch.commit();
};
