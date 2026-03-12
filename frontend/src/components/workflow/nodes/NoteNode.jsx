import React, { memo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { StickyNote } from 'lucide-react';
import NodeBase from './NodeBase';
import useThemeStore from '../../../stores/themeStore';
import useAuthStore from '../../../stores/authStore';

const NoteNode = memo(({ id, data, selected, onSaveNode, onDeleteNode, canEdit }) => {
    const { setNodes } = useReactFlow();
    const { darkMode } = useThemeStore();
    const { user } = useAuthStore();
    const [val, setVal] = useState(data.content || '');

    const authorName = data.authorName || user?.name || 'Anonymous';

    const handleChange = (e) => {
        const v = e.target.value;
        setVal(v);
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, content: v, label: v.substring(0, 30), authorName } } : n));
    };

    return (
        <div className="relative">
            <NodeBase
                id={id}
                data={data}
                selected={selected}
                title="Note"
                icon={StickyNote}
                minWidth={250}
                minHeight={250}
                onSaveNode={onSaveNode}
                onDeleteNode={onDeleteNode}
                canEdit={canEdit}
                hideHeader={true}
                rounded="rounded-none"
            >
                <div className="flex-1 flex flex-col min-h-0 p-5" style={{ backgroundColor: 'rgba(255, 226, 144, 1)' }}>
                    <textarea
                        value={val}
                        onChange={handleChange}
                        onKeyDown={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                        readOnly={canEdit === false}
                        className={`nodrag nowheel w-full flex-1 min-h-0 bg-transparent text-lg resize-none overflow-y-auto focus:outline-none leading-tight placeholder:opacity-20 font-bold text-black/80`}
                        placeholder="Write a note..."
                    />

                    <div className="mt-auto pt-4 flex items-center justify-between opacity-60">
                        <span className="italic text-black/60 capitalize">
                            {authorName}
                        </span>
                        <StickyNote size={14} className="text-black/40 rotate-12" />
                    </div>
                </div>
            </NodeBase>
        </div>
    );
});

export default NoteNode;
