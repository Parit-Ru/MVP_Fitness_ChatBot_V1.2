import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

interface Props {
  myUid: string;
  friendUid: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

const getChatId = (a: string, b: string) => [a, b].sort().join("_");

export function ChatPage({ myUid, friendUid }: Props) {
  const chatId = getChatId(myUid, friendUid);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    // สร้าง chat doc ถ้ายังไม่มี
    setDoc(
      doc(db, "chats", chatId),
      {
        members: [myUid, friendUid],
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt"),
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[],
      );
    });

    return unsub;
  }, [chatId, myUid, friendUid]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: myUid,
      text,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-xs p-2 rounded-lg ${
              msg.senderId === myUid
                ? "ml-auto bg-indigo-600 text-white"
                : "mr-auto bg-gray-200"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex p-3 border-t gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white px-4 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}
