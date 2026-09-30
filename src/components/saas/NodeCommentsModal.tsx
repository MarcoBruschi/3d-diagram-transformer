'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollaborationStore, NodeComment } from '@/store/useCollaborationStore';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/services/apiClient';
import {
  X,
  MessageSquare,
  Check,
  Send,
  User,
  Clock,
  CheckCircle2,
  Tag,
} from 'lucide-react';

export function NodeCommentsModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const modalPayload = useSaaSModalsStore((s) => s.modalPayload);

  const commentsMap = useCollaborationStore((s) => s.comments);
  const addComment = useCollaborationStore((s) => s.addComment);
  const toggleCommentResolved = useCollaborationStore((s) => s.toggleCommentResolved);
  const diagram = useDiagramStore((s) => s.diagram);
  const user = useAuthStore((s) => s.user);

  const [inputComment, setInputComment] = useState('');

  if (activeModal !== 'comments') return null;

  const targetNodeId = modalPayload?.nodeId || 'default';
  const targetNode = diagram.nodes.find((n) => n.id === targetNodeId) || {
    name: 'Topologia Geral de Arquitetura',
  };

  const commentsList = commentsMap[targetNodeId] || commentsMap['default'] || [];
  const authorName = user?.name || user?.email || 'Membro da Equipe';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const commentText = inputComment.trim();
    if (!commentText) return;

    addComment(targetNodeId, authorName, commentText);
    setInputComment('');

    if (diagram?.id) {
      try {
        await api.diagrams.createComment(diagram.id, {
          nodeId: targetNodeId !== 'default' ? targetNodeId : undefined,
          content: commentText,
        });
      } catch (err) {
        console.warn('[NodeCommentsModal] Falha ao persistir comentário no banco:', err);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Comentários Ancorados no Nó</span>
                  <span className="rounded bg-pink-500/10 border border-pink-500/30 px-2 py-0.5 text-[10px] text-pink-400 font-semibold">
                    Multiplayer
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                  Discussão técnica sobre: <strong>{targetNode.name}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {commentsList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Nenhum comentário ainda. Inicie a conversa técnica usando @mentions.
              </p>
            ) : (
              commentsList.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    c.resolved
                      ? 'border-slate-200 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-900/20 opacity-70'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-bold text-[10px]">
                        {c.authorName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.authorName}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-normal">({c.authorRole})</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCommentResolved(targetNodeId, c.id)}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        c.resolved
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      <span>{c.resolved ? 'Resolvido' : 'Marcar Resolvido'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 pl-8 leading-relaxed whitespace-pre-wrap">
                    {c.content}
                  </p>
                  <span className="text-[9px] text-slate-400 pl-8 block mt-1">{c.createdAt}</span>
                </div>
              ))
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleAdd} className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <input
              type="text"
              value={inputComment}
              onChange={(e) => setInputComment(e.target.value)}
              placeholder="Adicionar comentário técnico (ex: @equipe validar latência)..."
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              disabled={!inputComment.trim()}
              className="p-2.5 rounded-xl bg-pink-600 text-white hover:bg-pink-500 disabled:opacity-40 transition-colors shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
