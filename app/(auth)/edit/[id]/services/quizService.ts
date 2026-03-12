// ============================================================
// _services/quizService.ts
//
// Semua operasi I/O ke Supabase untuk fitur Edit Quiz.
// Tidak ada state, tidak ada React — murni async functions.
//
// Fungsi yang tersedia:
//   fetchQuizForEdit      – ambil quiz + validasi kepemilikan
//   autoSaveQuizInfo      – simpan field dasar quiz (debounced)
//   autoSaveQuestionImage – simpan image_url soal ke tabel questions
//   autoSaveAnswerImage   – simpan image_url jawaban ke tabel answers
//   deleteQuestionFromDb  – hapus satu soal dari tabel questions
//   saveQuiz              – simpan penuh quiz + semua soal (JSONB)
// ============================================================

import { supabase } from "@/lib/supabase";
import { generateId } from "@/lib/id-generator";
import { ANSWER_COLORS } from "../utils/constants";
import type { Quiz } from "../types";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

/** Payload yang cukup untuk auto-save field dasar */
export interface QuizInfoPayload {
  id: string;
  title: string;
  description: string | null;
  category: string;
  language: string;
  is_public: boolean;
  image_url: string | null;
}

/** Hasil dari saveQuiz */
export interface SaveQuizResult {
  success: boolean;
  error?: string;
}

// ────────────────────────────────────────────────────────────
// fetchQuizForEdit
// ────────────────────────────────────────────────────────────

/**
 * Mengambil data quiz dari Supabase dan memvalidasi bahwa
 * `authUserId` adalah pemilik quiz tersebut.
 * Mengembalikan Quiz yang sudah di-transform ke format app,
 * atau melempar Error jika tidak ada akses / tidak ditemukan.
 */
export async function fetchQuizForEdit(
  quizId: string,
  authUserId: string
): Promise<Quiz> {
  // 1. Cari profile id (XID) berdasarkan auth user
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (profileError || !profileData?.id) {
    throw new Error("Profile not found");
  }

  // 2. Cek kepemilikan quiz
  const { data: quizCheck, error: checkError } = await supabase
    .from("quizzes")
    .select("id, creator_id")
    .eq("id", quizId)
    .single();

  if (checkError) {
    throw checkError.code === "PGRST116"
      ? new Error("Quiz not found")
      : checkError;
  }

  if (quizCheck.creator_id !== profileData.id) {
    throw new Error("You don't have access to edit this quiz");
  }

  // 3. Ambil data lengkap
  const { data: quizData, error: quizError } = await supabase
    .from("quizzes")
    .select("id, title, description, category, language, is_public, image_url, questions")
    .eq("id", quizId)
    .single();

  if (quizError) throw quizError;
  if (!quizData) throw new Error("Quiz not found");

  // 4. Transform ke format app
  return _transformRawQuiz(quizData);
}

/** Transform raw Supabase row → Quiz domain object */
function _transformRawQuiz(raw: any): Quiz {
  const questionsArray: any[] = Array.isArray(raw.questions) ? raw.questions : [];

  return {
    id: raw.id,
    title: raw.title || "",
    description: raw.description || "",
    category: raw.category || "general",
    language: raw.language || "id",
    is_public: raw.is_public || false,
    image_url: raw.image_url || null,
    questions: questionsArray
      .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0))
      .map((q, qIndex) => {
        const answersArray: any[] = Array.isArray(q?.answers) ? q.answers : [];
        return {
          id: q?.id || `temp_q_${qIndex}`,
          text: q?.question || q?.question_text || "",
          timeLimit: q?.time_limit || 30,
          image_url: q?.image || q?.image_url || null,
          answers: answersArray
            .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0))
            .map((a, aIndex) => ({
              id: aIndex.toString(),
              text: a?.answer || a?.answer_text || "",
              color: a?.color || ANSWER_COLORS[aIndex % ANSWER_COLORS.length],
              image_url: a?.image || a?.image_url || null,
            })),
          correct: (() => {
            if (q?.correct !== undefined) return q.correct.toString();
            const idx = answersArray.findIndex((a) => a?.is_correct);
            return (idx >= 0 ? idx : 0).toString();
          })(),
        };
      }),
  };
}

// ────────────────────────────────────────────────────────────
// autoSaveQuizInfo
// ────────────────────────────────────────────────────────────

/**
 * Menyimpan field dasar quiz (title, description, dst.)
 * tanpa menyentuh JSONB questions.
 * Dipanggil dari debounced handler di hook.
 */
export async function autoSaveQuizInfo(payload: QuizInfoPayload): Promise<void> {
  const { error } = await supabase
    .from("quizzes")
    .update({
      title: payload.title,
      description: payload.description,
      category: payload.category,
      language: payload.language,
      is_public: payload.is_public,
      image_url: payload.image_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id);

  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// autoSaveQuestionImage
// ────────────────────────────────────────────────────────────

/**
 * Menyimpan image_url satu soal ke tabel `questions`.
 * Cek dulu apakah soal sudah ada di DB (skip jika belum).
 */
export async function autoSaveQuestionImage(
  questionId: string,
  imageUrl: string | null
): Promise<void> {
  // Soal baru (id dimulai "new_") belum ada di DB, skip
  if (questionId.startsWith("new_")) return;

  const { data: existing, error: checkError } = await supabase
    .from("questions")
    .select("id")
    .eq("id", questionId)
    .single();

  if (checkError || !existing) return;

  const { error } = await supabase
    .from("questions")
    .update({ image_url: imageUrl })
    .eq("id", questionId);

  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// autoSaveAnswerImage
// ────────────────────────────────────────────────────────────

/**
 * Menyimpan image_url satu jawaban ke tabel `answers`.
 * Cek dulu apakah jawaban sudah ada di DB (skip jika belum).
 */
export async function autoSaveAnswerImage(
  answerId: string,
  imageUrl: string | null
): Promise<void> {
  if (answerId.startsWith("new_")) return;

  const { data: existing, error: checkError } = await supabase
    .from("answers")
    .select("id")
    .eq("id", answerId)
    .single();

  if (checkError || !existing) return;

  const { error } = await supabase
    .from("answers")
    .update({ image_url: imageUrl })
    .eq("id", answerId);

  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// deleteQuestionFromDb
// ────────────────────────────────────────────────────────────

/**
 * Menghapus satu soal dari tabel `questions`.
 * Soal baru (id "new_") tidak perlu dihapus dari DB.
 */
export async function deleteQuestionFromDb(questionId: string): Promise<void> {
  if (questionId.startsWith("new_")) return;

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// saveQuiz  (full save)
// ────────────────────────────────────────────────────────────

/**
 * Menyimpan quiz secara penuh:
 *  1. Update field dasar quiz
 *  2. Proses semua soal + jawaban ke format JSONB
 *  3. Update kolom `questions` dengan JSONB baru
 *
 * Mengembalikan { success: true } atau { success: false, error }
 */
export async function saveQuiz(quiz: Quiz, isPublicRequest: boolean = false): Promise<SaveQuizResult> {
  try {
    // Step 1 – field dasar
    const { error: infoError } = await supabase
      .from("quizzes")
      .update({
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        language: quiz.language,
        is_public: isPublicRequest ? false : quiz.is_public, // Always false if requesting public
        request: isPublicRequest, // true if user wants public review
        image_url: quiz.image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quiz.id);

    if (infoError) throw infoError;

    // Step 2 – serialisasi soal ke JSONB
    const processedQuestions = quiz.questions.map((question) => ({
      id: question.id.startsWith("new_") ? generateId() : question.id,
      question: question.text,
      type: "multiple_choice",
      image: question.image_url || null,
      correct: question.correct,
      answers: question.answers.map((answer, aIndex) => ({
        id: aIndex.toString(),
        answer: answer.text,
        image: answer.image_url || null,
      })),
    }));

    // Step 3 – simpan JSONB
    const { error: questionsError } = await supabase
      .from("quizzes")
      .update({
        questions: processedQuestions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quiz.id);

    if (questionsError) throw questionsError;

    return { success: true };
  } catch (error: any) {
    console.error("[quizService] saveQuiz failed:", error);
    return {
      success: false,
      error: error?.message || "Unknown error",
    };
  }
}
