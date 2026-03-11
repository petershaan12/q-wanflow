import { 
    Inbox, FileText, Image, Video, Volume2, Copy,
    MousePointer2, Hand, Eraser, Package, MessageCircle 
} from 'lucide-react';

export const NODE_PALETTE = [
    { type: 'wan_input', name: 'Input', icon: Inbox, desc: 'Starting data', color: 'bg-info/15 text-info border-info/20', category: 'basics' },
    { type: 'prompt', name: 'Prompt Template', icon: FileText, desc: 'Template with vars', color: 'bg-primary/15 text-primary border-primary/20', category: 'basics' },
    { type: 'wan_image_t2i', name: 'T2I · Text to Image',   icon: Image,  desc: 'Text → Image (wan2.6)',          color: 'bg-warning/15 text-warning border-warning/20',      category: 'media' },
    { type: 'wan_image_edit', name: 'Image Edit · Multi-Ref', icon: Copy,   desc: 'Edit/Combine Images (wan2.6)', color: 'bg-warning/15 text-warning border-warning/20',      category: 'media' },
    { type: 'wan_video_t2v', name: 'T2V · Text to Video',        icon: Video,  desc: 'Text → Video (wan2.6-t2v)',     color: 'bg-secondary/15 text-secondary border-secondary/20', category: 'media' },
    { type: 'wan_video_i2v', name: 'I2V · Image to Video',       icon: Video,  desc: 'Image → Video (wan2.6-i2v)',    color: 'bg-secondary/15 text-secondary border-secondary/20', category: 'media' },
    { type: 'wan_video_r2v', name: 'R2V · Reference to Video',   icon: Video,  desc: 'Video → Video (wan2.6-r2v)',    color: 'bg-secondary/15 text-secondary border-secondary/20', category: 'media' },
    { type: 'wan_video_ifi', name: 'IFI · First & Last Frame',   icon: Video,  desc: 'Frame → Video (kf2v)',          color: 'bg-secondary/15 text-secondary border-secondary/20', category: 'media' },
    { type: 'text_to_speech', name: 'Text to Speech', icon: Volume2, desc: 'Audio generation', color: 'bg-neutral/30 text-base-content border-base-300/40', category: 'media' },
];

export const ZOOM_PRESETS = [50, 75, 85, 90, 100, 125, 150, 200];

export const TOOL_CURSOR = {
    default: 'default',
    hand: 'grab',
    material: 'copy',
    eraser: `url("/erase.svg") 2 2, auto`,
    comment: `url("/comment.svg") 0 22, auto`,
};

export const TOOLS = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)' },
    { id: 'hand', icon: Hand, label: 'Hand (H)' },
    { id: 'eraser', icon: Eraser, label: 'Eraser (X)' },
    { id: 'material', icon: Package, label: 'Add Node (A)' },
    { id: 'comment', icon: MessageCircle, label: 'Comment (C)' },
];
