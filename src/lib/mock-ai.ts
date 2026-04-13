import { v4 as uuidv4 } from "uuid";
import {
  CharacterProfile,
  BackgroundAsset,
  StoryboardScene,
} from "@/types";

const PLACEHOLDER_CHARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face",
];

const PLACEHOLDER_BGS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1518173946687-a1e0e8d7e12b?w=800&h=450&fit=crop",
];

const PLACEHOLDER_SCENES = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=800&h=450&fit=crop",
];

const CHARACTER_NAMES = ["林晓", "张远", "苏婉", "陈风"];
const CHARACTER_DESCS = [
  "性格沉稳，身着深色风衣的青年男性，眼神坚定",
  "温柔知性的女性，长发披肩，总是带着淡淡微笑",
  "活泼开朗的少女，短发利落，运动系穿搭",
  "神秘莫测的中年男人，灰色西装，举止优雅",
];

const CAMERA_ANGLES = [
  "正面中景",
  "侧面特写",
  "俯拍全景",
  "仰拍近景",
  "跟随移动镜头",
  "固定远景",
  "手持晃动近景",
  "慢推特写",
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeContent(text: string): Promise<{
  characters: CharacterProfile[];
  backgrounds: BackgroundAsset[];
}> {
  await delay(2000);

  const charCount = Math.min(2 + Math.floor(text.length / 200), 4);
  const bgCount = Math.min(3 + Math.floor(text.length / 300), 6);

  const characters: CharacterProfile[] = Array.from(
    { length: charCount },
    (_, i) => ({
      id: uuidv4(),
      name: CHARACTER_NAMES[i % CHARACTER_NAMES.length],
      description: CHARACTER_DESCS[i % CHARACTER_DESCS.length],
      imageUrl: PLACEHOLDER_CHARS[i % PLACEHOLDER_CHARS.length],
      tags: ["主要角色", i === 0 ? "主角" : "配角"],
    })
  );

  const bgNames = ["城市街道", "山间小屋", "星空下的湖泊", "茂密森林", "悬崖边的灯塔", "古老咖啡馆"];
  const bgDescs = [
    "繁华都市的街道，霓虹灯闪烁，行人匆匆",
    "坐落在山谷中的木质小屋，烟囱冒着炊烟",
    "繁星点点的夜空下，宁静的湖面倒映着月光",
    "阳光透过密叶洒下斑驳光影的古老森林",
    "暴风雨中矗立在悬崖边的孤独灯塔",
    "昏黄灯光下的复古咖啡馆，弥漫着咖啡香气",
  ];

  const backgrounds: BackgroundAsset[] = Array.from(
    { length: bgCount },
    (_, i) => ({
      id: uuidv4(),
      name: bgNames[i % bgNames.length],
      description: bgDescs[i % bgDescs.length],
      imageUrl: PLACEHOLDER_BGS[i % PLACEHOLDER_BGS.length],
      tags: ["场景", i < 2 ? "室外" : "室内"],
    })
  );

  return { characters, backgrounds };
}

export async function generateStoryboard(
  text: string,
  characters: CharacterProfile[],
  backgrounds: BackgroundAsset[]
): Promise<StoryboardScene[]> {
  await delay(2500);

  const sentences = text
    .replace(/[。！？]/g, "|")
    .split("|")
    .filter((s) => s.trim().length > 5);

  const sceneCount = Math.max(3, Math.min(sentences.length, 8));

  const sceneTemplates = [
    { desc: "开场：镜头缓缓推进，展现环境全貌", action: "角色缓缓走入画面，停步凝望远方", dialogue: "" },
    { desc: "角色初次登场，展现人物性格", action: "角色转身面对镜头，表情复杂", dialogue: "一切都将改变..." },
    { desc: "情节推进，关键对话场景", action: "两个角色面对面交谈，情绪逐渐升温", dialogue: "你不明白，这是唯一的办法。" },
    { desc: "转折点，意外事件发生", action: "角色突然停下脚步，惊讶地看向远处", dialogue: "这不可能..." },
    { desc: "高潮场景，紧张对峙", action: "角色之间的对峙达到顶峰，气氛紧绷", dialogue: "做出你的选择！" },
    { desc: "情感场景，内心独白", action: "角色独自站在窗前，望着窗外的雨", dialogue: "(内心) 也许这就是命运..." },
    { desc: "结局铺垫，希望重现", action: "角色们重新聚集，目光坚定", dialogue: "我们一起面对。" },
    { desc: "结尾：镜头渐远，留下悬念", action: "角色背影渐行渐远，消失在光影中", dialogue: "" },
  ];

  const scenes: StoryboardScene[] = Array.from(
    { length: sceneCount },
    (_, i) => {
      const tpl = sceneTemplates[i % sceneTemplates.length];
      return {
        id: uuidv4(),
        order: i + 1,
        sceneDescription:
          sentences[i]?.trim() || tpl.desc,
        characterAction: tpl.action,
        cameraAngle: CAMERA_ANGLES[i % CAMERA_ANGLES.length],
        duration: 3 + Math.floor(Math.random() * 5),
        dialogues: tpl.dialogue,
        characterIds: characters
          .slice(0, Math.min(2, i % characters.length + 1))
          .map((c) => c.id),
        backgroundId:
          backgrounds[i % backgrounds.length]?.id || backgrounds[0]?.id,
        previewUrl: PLACEHOLDER_SCENES[i % PLACEHOLDER_SCENES.length],
        status: "pending",
      };
    }
  );

  return scenes;
}

export async function generateSceneVideo(
  sceneId: string
): Promise<string> {
  await delay(1500 + Math.random() * 2000);
  return `https://example.com/clips/${sceneId}.mp4`;
}

export async function compositeVideo(
  _scenes: StoryboardScene[]
): Promise<string> {
  await delay(3000);
  return "https://example.com/final/output.mp4";
}
