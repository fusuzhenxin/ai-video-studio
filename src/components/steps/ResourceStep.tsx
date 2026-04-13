"use client";

import React, { useState } from "react";
import { Users, Mountain, ArrowRight, Pencil, Trash2, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useProject } from "@/context/ProjectContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ResourceStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ResourceStep({ onNext, onBack }: ResourceStepProps) {
  const { project, setCharacters, setBackgrounds } = useProject();
  const [activeTab, setActiveTab] = useState<"characters" | "backgrounds">("characters");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleEditChar = (id: string) => {
    const char = project.characters.find((c) => c.id === id);
    if (char) {
      setEditingId(id);
      setEditName(char.name);
      setEditDesc(char.description);
    }
  };

  const handleSaveChar = () => {
    if (!editingId) return;
    setCharacters(
      project.characters.map((c) =>
        c.id === editingId ? { ...c, name: editName, description: editDesc } : c
      )
    );
    setEditingId(null);
  };

  const handleDeleteChar = (id: string) => {
    setCharacters(project.characters.filter((c) => c.id !== id));
  };

  const handleEditBg = (id: string) => {
    const bg = project.backgrounds.find((b) => b.id === id);
    if (bg) {
      setEditingId(id);
      setEditName(bg.name);
      setEditDesc(bg.description);
    }
  };

  const handleSaveBg = () => {
    if (!editingId) return;
    setBackgrounds(
      project.backgrounds.map((b) =>
        b.id === editingId ? { ...b, name: editName, description: editDesc } : b
      )
    );
    setEditingId(null);
  };

  const handleDeleteBg = (id: string) => {
    setBackgrounds(project.backgrounds.filter((b) => b.id !== id));
  };

  const addNewCharacter = () => {
    const newChar = {
      id: uuidv4(),
      name: "新角色",
      description: "角色描述...",
      imageUrl:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face",
      tags: ["自定义"],
    };
    setCharacters([...project.characters, newChar]);
    handleEditChar(newChar.id);
  };

  const addNewBackground = () => {
    const newBg = {
      id: uuidv4(),
      name: "新场景",
      description: "场景描述...",
      imageUrl:
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=450&fit=crop",
      tags: ["自定义"],
    };
    setBackgrounds([...project.backgrounds, newBg]);
    handleEditBg(newBg.id);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--secondary)] rounded-lg w-fit">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "characters"
              ? "bg-[var(--primary)] text-white shadow"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => { setActiveTab("characters"); setEditingId(null); }}
        >
          <Users size={16} />
          角色 ({project.characters.length})
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "backgrounds"
              ? "bg-[var(--primary)] text-white shadow"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => { setActiveTab("backgrounds"); setEditingId(null); }}
        >
          <Mountain size={16} />
          背景 ({project.backgrounds.length})
        </button>
      </div>

      {/* Characters Tab */}
      {activeTab === "characters" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {project.characters.map((char) => (
              <Card key={char.id} className="overflow-hidden p-0">
                <div className="aspect-square relative">
                  <img
                    src={char.imageUrl}
                    alt={char.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEditChar(char.id)}
                      className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[var(--primary)] transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteChar(char.id)}
                      className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {editingId === char.id ? (
                  <div className="p-3 space-y-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 text-sm rounded bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-xs rounded bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveChar}>保存</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>取消</Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3">
                    <h4 className="font-semibold text-[var(--foreground)]">{char.name}</h4>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                      {char.description}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {char.tags.map((tag) => (
                        <Badge key={tag} variant="primary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {/* Add New Character */}
            <Card
              hover
              className="flex flex-col items-center justify-center min-h-[200px] border-dashed cursor-pointer"
              onClick={addNewCharacter}
            >
              <Plus size={32} className="text-[var(--muted-foreground)] mb-2" />
              <span className="text-sm text-[var(--muted-foreground)]">添加角色</span>
            </Card>
          </div>
        </div>
      )}

      {/* Backgrounds Tab */}
      {activeTab === "backgrounds" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.backgrounds.map((bg) => (
              <Card key={bg.id} className="overflow-hidden p-0">
                <div className="aspect-video relative">
                  <img
                    src={bg.imageUrl}
                    alt={bg.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEditBg(bg.id)}
                      className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[var(--primary)] transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteBg(bg.id)}
                      className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {editingId === bg.id ? (
                  <div className="p-3 space-y-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 text-sm rounded bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-xs rounded bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveBg}>保存</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>取消</Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3">
                    <h4 className="font-semibold text-[var(--foreground)]">{bg.name}</h4>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                      {bg.description}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {bg.tags.map((tag) => (
                        <Badge key={tag} variant="primary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {/* Add New Background */}
            <Card
              hover
              className="flex flex-col items-center justify-center min-h-[140px] border-dashed cursor-pointer"
              onClick={addNewBackground}
            >
              <Plus size={32} className="text-[var(--muted-foreground)] mb-2" />
              <span className="text-sm text-[var(--muted-foreground)]">添加背景</span>
            </Card>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onBack}>
          返回修改
        </Button>
        <Button
          size="lg"
          onClick={onNext}
          disabled={project.characters.length === 0 || project.backgrounds.length === 0}
        >
          生成分镜脚本
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
