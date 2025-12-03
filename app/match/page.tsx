"use client";

import { useState, useEffect } from "react";
import MatchingResult from "@/components/MatchingResult";
import { getParticipants, saveAllParticipants, Participant } from "@/lib/data";
import { Sparkles, ArrowLeft, Key, Eye, Play } from "lucide-react";
import Link from "next/link";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ViewState = "selection" | "view-results" | "exchange";

export default function MatchPage() {
  const [viewState, setViewState] = useState<ViewState>("selection");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [hasExistingMatches, setHasExistingMatches] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if matches exist on initial load
    const checkMatches = async () => {
      const data = await getParticipants();
      const matchesExist =
        data.length > 0 && data.some((p) => p.assignedBookId);
      setHasExistingMatches(matchesExist);
    };
    checkMatches();
  }, []);

  const handleMatch = async () => {
    setLoading(true);
    setError("");

    if (!apiKey) {
      setError("請輸入 API 金鑰");
      setLoading(false);
      return;
    }

    // Refresh participants before matching to ensure we have latest
    const currentParticipants = await getParticipants();
    if (currentParticipants.length < 2) {
      setError("至少需要 2 位參加者。");
      setLoading(false);
      return;
    }
    setParticipants(currentParticipants);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Using Gemini 2.5 Flash as requested
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        你是聖誕交換禮物配對引擎。
        我有一份參加者清單，每個人都帶了一本書並有一份願望清單。
        
        規則：
        1. 每位參加者必須恰好收到一本書。
        2. 參加者不能收到自己帶來的書。
        3. 盡量將書籍與參加者的願望清單進行最佳配對。
        4. 使用書籍描述來理解書的內容，並與願望清單進行配對。
        5. 提供有趣的、聖誕主題的配對理由，引用書籍內容。
        
        參加者：
        ${JSON.stringify(
          currentParticipants.map((p) => ({
            id: p.id,
            name: p.name,
            broughtBookId: p.id, // Using participant ID as book ID for simplicity since 1 person = 1 book
            broughtBookTitle: p.bookTitle,
            broughtBookAuthors: p.bookAuthors,
            broughtBookDescription: p.bookDescription, // Added description
            wishlist: p.wishlist,
          })),
          null,
          2
        )}

        輸出必須是以下結構的有效 JSON 陣列：
        [
          {
            "recipientId": "participant_id",
            "assignedBookFromId": "donor_participant_id",
            "reason": "此配對的理由..."
          }
        ]
        請勿包含如 \`\`\`json 這樣的 markdown 格式。只要純 JSON。
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let matches;
      try {
        matches = JSON.parse(responseText);
      } catch (e) {
        console.error("無法解析 AI 回應", responseText);
        setError("AI 返回無效格式");
        setLoading(false);
        return;
      }

      // Update participants with match data
      const updatedParticipants = currentParticipants.map((p) => {
        const match = matches.find((m: any) => m.recipientId === p.id);
        if (match) {
          return {
            ...p,
            assignedBookId: match.assignedBookFromId,
            assignedReason: match.reason,
          };
        }
        return p;
      });

      await saveAllParticipants(updatedParticipants);
      setParticipants(updatedParticipants);
      setViewState("view-results");
      setHasExistingMatches(true);
    } catch (err) {
      console.error("配對錯誤：", err);
      setError("配對過程中發生錯誤。請檢查您的 API 金鑰。");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = async () => {
    const data = await getParticipants();
    setParticipants(data);
    setViewState("view-results");
  };

  const handleStartExchange = () => {
    setViewState("exchange");
  };

  const handleBackToSelection = () => {
    setViewState("selection");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-red-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> 回到登記頁
        </Link>

        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            禮物交換配對
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </h1>
          <p className="text-gray-600 mt-2">
            {viewState === "selection"
              ? "請在下方選擇您的操作！"
              : "讓 AI 魔法為每個人找到完美的書籍！"}
          </p>
        </header>

        {viewState === "selection" && (
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={handleViewResults}
                disabled={!hasExistingMatches}
                className={`p-8 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  hasExistingMatches
                    ? "bg-white border-green-200 hover:border-green-300 hover:shadow-lg"
                    : "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div
                    className={`p-4 rounded-full ${hasExistingMatches ? "bg-green-100" : "bg-gray-100"}`}
                  >
                    <Eye
                      className={`w-8 h-8 ${hasExistingMatches ? "text-green-600" : "text-gray-400"}`}
                    />
                  </div>
                  <h3
                    className={`text-xl font-bold ${hasExistingMatches ? "text-gray-900" : "text-gray-500"}`}
                  >
                    查看結果
                  </h3>
                  <p
                    className={`text-sm ${hasExistingMatches ? "text-gray-600" : "text-gray-400"}`}
                  >
                    {hasExistingMatches
                      ? "查看已完成的配對結果"
                      : "尚無配對結果"}
                  </p>
                </div>
              </button>

              <button
                onClick={handleStartExchange}
                className="p-8 rounded-xl border-2 bg-white border-red-200 hover:border-red-300 hover:shadow-lg transition-all transform hover:scale-105"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-red-100">
                    <Play className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">開始交換</h3>
                  <p className="text-sm text-gray-600">
                    讓 AI 老公公進行新的書籍配對
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {viewState === "exchange" && (
          <div className="max-w-md mx-auto">
            <button
              onClick={handleBackToSelection}
              className="mb-4 text-gray-600 hover:text-red-600 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> 返回選擇
            </button>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="輸入您的 API 金鑰"
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border placeholder:text-gray-700"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  AI 魔法需要此金鑰才能運作。
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleMatch}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all transform hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" /> 配對中...
                  </span>
                ) : (
                  "開始配對魔法 ✨"
                )}
              </button>
            </div>
          </div>
        )}

        {viewState === "view-results" && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={handleBackToSelection}
                className="text-gray-600 hover:text-red-600 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> 返回選擇
              </button>
              <h2 className="text-2xl font-bold text-gray-800">配對結果</h2>
              <button
                onClick={handleStartExchange}
                className="text-sm text-red-600 hover:underline"
              >
                重新配對
              </button>
            </div>
            <MatchingResult participants={participants} />
          </div>
        )}
      </div>
    </div>
  );
}
