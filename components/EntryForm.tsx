"use client";

import { useState, useEffect } from "react";
import Scanner from "./Scanner";
import {
  Book,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  UserCheck,
  Edit3,
} from "lucide-react";
import {
  saveParticipant,
  getParticipants,
  Participant,
  getFullName,
} from "@/lib/data";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";

export default function EntryForm({
  onEntryAdded,
  refreshTrigger,
}: {
  onEntryAdded: () => void;
  refreshTrigger?: number;
}) {
  const [mode, setMode] = useState<"checkin" | "new">("checkin");
  const [existingParticipants, setExistingParticipants] = useState<
    Participant[]
  >([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [isbn, setIsbn] = useState("");
  const [wishlist, setWishlist] = useState("");

  // Book fields
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthors, setBookAuthors] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [bookThumbnail, setBookThumbnail] = useState("");
  const [manualEntry, setManualEntry] = useState(false);

  const [loadingBook, setLoadingBook] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load participants for search - refresh when refreshTrigger changes
  useEffect(() => {
    loadParticipants();
  }, [refreshTrigger]);

  // Initialize ID with UUID when component loads and mode is new
  useEffect(() => {
    if (mode === "new" && !id) {
      setId(uuidv4());
    }
  }, [mode, id]);

  const loadParticipants = async () => {
    const data = await getParticipants();
    setExistingParticipants(data);
  };

  const handleScan = (code: string) => {
    if (code !== isbn) {
      setIsbn(code);
      fetchBookDetails(code);
    }
  };

  const fetchBookDetails = async (code: string) => {
    setLoadingBook(true);
    setManualEntry(false); // Reset manual entry if scanning
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${code}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.totalItems > 0 && data.items) {
          const book = data.items[0].volumeInfo;
          setBookTitle(book.title || "");
          setBookAuthors(book.authors ? book.authors.join(", ") : "");
          setBookDescription(book.description || book.subtitle || "");
          setBookThumbnail(book.imageLinks?.thumbnail || "");
        } else {
          setMessage({
            type: "error",
            text: "找不到書籍。請手動輸入詳細資料。",
          });
          setManualEntry(true);
        }
      } else {
        console.error("Book not found");
        setManualEntry(true);
      }
    } catch (fetchError) {
      console.error("Error fetching book", fetchError);
      setManualEntry(true);
    } finally {
      setLoadingBook(false);
    }
  };

  const handleSelectParticipant = (p: Participant) => {
    setSelectedParticipantId(p.id);
    setFirstName(p.firstName);
    setLastName(p.lastName);
    setEmail(p.email);
    setId(p.id);
    setWishlist(p.wishlist);
    if (p.bookIsbn) {
      setMessage({
        type: "error",
        text: "注意：此參加者已有書籍。送出將更新其書籍資訊。",
      });
      setIsbn(p.bookIsbn);
      setBookTitle(p.bookTitle);
      setBookAuthors(p.bookAuthors.join(", "));
      setBookDescription(p.bookDescription || "");
    } else {
      setMessage(null);
      setIsbn("");
      setBookTitle("");
      setBookAuthors("");
      setBookDescription("");
      setBookThumbnail("");
    }
    setSearchQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    // Validation: Check for duplicate ID in 'new' mode
    if (mode === "new") {
      // Fetch fresh participant data to ensure we have the latest list for duplicate checking
      const currentParticipants = await getParticipants();
      const duplicate = currentParticipants.find(
        (p) => String(p.id) === String(id)
      );
      if (duplicate) {
        setMessage({
          type: "error",
          text: `ID '${id}' 已存在（參加者：${getFullName(duplicate)}）。請使用唯一 ID。`,
        });
        setSubmitting(false);
        return;
      }
    }

    try {
      await saveParticipant({
        id,
        firstName,
        lastName,
        email,
        bookIsbn: isbn,
        bookTitle: bookTitle || "Unknown Title",
        bookAuthors: bookAuthors
          ? bookAuthors.split(",").map((a) => a.trim())
          : [],
        bookDescription,
        wishlist,
      });

      setMessage({
        type: "success",
        text: mode === "checkin" ? "報到成功！" : "參加者已新增！",
      });

      // Reset form
      if (mode === "new") {
        setFirstName("");
        setLastName("");
        setEmail("");
        setId(uuidv4()); // Generate new UUID for next participant
        setWishlist("");
      } else {
        setSelectedParticipantId(null);
        setFirstName("");
        setLastName("");
        setEmail("");
        setId("");
        setWishlist("");
      }
      setIsbn("");
      setBookTitle("");
      setBookAuthors("");
      setBookDescription("");
      setBookThumbnail("");
      setManualEntry(false);

      // Refresh list
      setTimeout(() => {
        onEntryAdded();
        loadParticipants(); // Reload for next search
      }, 1000);
    } catch (submitError) {
      console.error("Error submitting participant:", submitError);
      setMessage({ type: "error", text: "發生錯誤。" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredParticipants = existingParticipants.filter((p) => {
    const fullName = getFullName(p).toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      String(p.id).toLowerCase().includes(query) ||
      String(p.email).toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Book className="w-6 h-6 text-red-600" />
          {mode === "checkin" ? "活動報到" : "新登記"}
        </h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setMode("checkin");
              setMessage(null);
            }}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mode === "checkin" ? "bg-white shadow text-red-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            報到
          </button>
          <button
            onClick={() => {
              setMode("new");
              setMessage(null);
              setSelectedParticipantId(null);
              setFirstName("");
              setLastName("");
              setEmail("");
              setId(uuidv4()); // Generate UUID when switching to new mode
              setWishlist("");
            }}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mode === "new" ? "bg-white shadow text-red-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            新增
          </button>
        </div>
      </div>

      {mode === "checkin" && !selectedParticipantId && (
        <div className="mb-6 relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            搜尋已預先報名的參加者
          </label>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="以姓名或 ID 搜尋..."
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-3 border placeholder:text-gray-700"
            />
          </div>
          {searchQuery && (
            <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectParticipant(p)}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 flex justify-between items-center border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {getFullName(p)}
                      </p>
                      <p className="text-xs text-gray-500" title={p.id}>
                        ID: {p.id.substring(0, 8)}
                      </p>
                    </div>
                    {p.bookIsbn ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  找不到參加者。
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(mode === "new" || selectedParticipantId) && (
        <div className="animate-fade-in">
          {selectedParticipantId && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700 font-medium">
                  報到中：
                  <span className="font-bold">
                    {lastName} {firstName}
                  </span>
                </p>
                <p className="text-xs text-blue-500" title={id}>
                  ID: {id.substring(0, 8)}
                </p>
              </div>
              <button
                onClick={() => setSelectedParticipantId(null)}
                className="text-xs text-blue-600 hover:underline"
              >
                變更
              </button>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              掃描書本條碼
            </label>
            <Scanner onScanSuccess={handleScan} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  姓氏
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={mode === "checkin"}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-700"
                  placeholder="陳"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  名字
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={mode === "checkin"}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-700"
                  placeholder="小明"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mode === "checkin"}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500 placeholder:text-gray-700"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                參加者 ID (UUID)
              </label>
              <input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={true}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border bg-gray-100 text-gray-500 placeholder:text-gray-700"
                placeholder="自動生成的 UUID"
              />
            </div>

            {/* Book Details Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">書本詳細資料</h3>
                <button
                  type="button"
                  onClick={() => setManualEntry(!manualEntry)}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />{" "}
                  {manualEntry ? "取消編輯" : "手動編輯"}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  onBlur={() => isbn && !manualEntry && fetchBookDetails(isbn)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border placeholder:text-gray-700"
                  placeholder="ISBN（掃描或輸入）"
                />
                <button
                  type="button"
                  onClick={() => fetchBookDetails(isbn)}
                  disabled={loadingBook || !isbn}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  查詢
                </button>
              </div>

              {loadingBook && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> 正在取得資訊...
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  disabled={!manualEntry}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-900"
                  placeholder="書名"
                />
                <input
                  type="text"
                  value={bookAuthors}
                  onChange={(e) => setBookAuthors(e.target.value)}
                  disabled={!manualEntry}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-900"
                  placeholder="作者（逗號分隔）"
                />
                <textarea
                  value={bookDescription}
                  onChange={(e) => setBookDescription(e.target.value)}
                  disabled={!manualEntry}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-900"
                  placeholder="書籍描述 / 摘要"
                />
              </div>
              {bookThumbnail && (
                <Image
                  src={bookThumbnail}
                  alt="Cover"
                  width={64}
                  height={96}
                  className="w-16 h-24 object-cover rounded shadow-sm"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                願望清單 / 喜好
              </label>
              <textarea
                required
                value={wishlist}
                onChange={(e) => setWishlist(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border placeholder:text-gray-700"
                placeholder="我喜歡科幻和懸疑小說..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {submitting
                ? "儲存中..."
                : mode === "checkin"
                  ? "報到並更新紀錄"
                  : "新增參加者"}
            </button>

            {message && (
              <div
                className={`p-3 rounded-md flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                {message.text}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
