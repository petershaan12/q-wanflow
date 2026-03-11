import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    MiniMap,
    useReactFlow,
    ConnectionLineType,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';

import { Save, Share2, Search } from 'lucide-react';

import {
    InputNode, PromptNode,
    WanImageT2I, WanImageEdit,
    WanVideoT2V, WanVideoI2V, WanVideoR2V, WanVideoIFI,
    TextToSpeechNode,
    CommentNode
} from '../components/workflow/nodes';
import ShareModal from '../components/workflow/ShareModal';

import Topbar from '../components/Topbar';
import useThemeStore from '../stores/themeStore';
import useAuthStore from '../stores/authStore';

// New Components & Hooks
import EditorToolbar from '../components/workflow/editor/EditorToolbar';
import MaterialPanel from '../components/workflow/editor/MaterialPanel';
import ZoomControls from '../components/workflow/editor/ZoomControls';
import NodeContextMenu from '../components/workflow/editor/NodeContextMenu';
import { useWorkflowEditor, isTextEditingElement } from '../hooks/useWorkflowEditor';
import { TOOL_CURSOR, NODE_PALETTE } from '../components/workflow/editor/EditorConstants';

const InnerWorkflowEditor = () => {
    const { id: workflowId } = useParams();
    const navigate = useNavigate();

    // Auto-save visited workflow/project to localStorage for Recents on Dashboard
    useEffect(() => {
        if (workflowId) {
            localStorage.setItem('recent_workflow_id', workflowId);
        }
    }, [workflowId]);
    const { darkMode } = useThemeStore();
    const { user } = useAuthStore();
    const [activeTool, setActiveTool] = useState('select');
    const [toast, setToast] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const [menu, setMenu] = useState(null);
    const reactFlowWrapper = useRef(null);
    const reactFlowInstance = useReactFlow();

    const showToast = useCallback((type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 5000);
    }, []);

    // Extract all core logic to custom hook
    const workflow = useWorkflowEditor(workflowId, showToast);

    const {
        nodes, edges, workflowName, loading, saving, autoSaving, lastAutoSavedAt, isEditingText,
        setNodes, setEdges, setWorkflowName,
        onNodesChange, onEdgesChange,
        handleUndo, handleRedo, canUndo, canRedo,
        deleteNode, duplicateNode, renameNode, onConnect, deleteEdge, saveNodeToBackend, updateNodeConfig, saveWorkflowManually,
        shareId, sharePermission, updateSharePermission, ownerId,
        pushHistory
    } = workflow;

    const isOwner = user?.id === ownerId;
    const canEdit = isOwner || sharePermission === 'edit';

    // Node Types definition
    const nodeTypes = useMemo(() => ({
        wan_input: (props) => <InputNode         {...props} canEdit={canEdit} showToast={showToast} onDeleteNode={deleteNode} />,
        prompt: (props) => <PromptNode         {...props} canEdit={canEdit} showToast={showToast} onDeleteNode={deleteNode} />,
        wan_image_t2i: (props) => <WanImageT2I        {...props} canEdit={canEdit} showToast={showToast} onDeleteNode={deleteNode} />,
        wan_image_edit: (props) => <WanImageEdit       {...props} canEdit={canEdit} showToast={showToast} onDeleteNode={deleteNode} />,
        wan_video_t2v: (props) => <WanVideoT2V        {...props} canEdit={canEdit} showToast={showToast} onDeleteNode={deleteNode} />,
        wan_video_i2v: (props) => <WanVideoI2V        {...props} canEdit={canEdit} showToast={showToast} onDeleteNode={deleteNode} />,
        wan_video_r2v: (props) => <WanVideoR2V        {...props} canEdit={canEdit} showToast={showToast} onDeleteNode={deleteNode} />,
        wan_video_ifi: (props) => <WanVideoIFI        {...props} canEdit={canEdit} showToast={showToast} onDeleteNode={deleteNode} />,
        text_to_speech: (props) => <TextToSpeechNode   {...props} canEdit={canEdit} showToast={showToast} onDeleteNode={deleteNode} />,
        comment: (props) => <CommentNode         {...props} canEdit={canEdit} showToast={showToast} onDeleteNode={deleteNode} onSaveNode={updateNodeConfig} />,
    }), [showToast, deleteNode, updateNodeConfig, canEdit]);

    const onMoveEnd = useCallback((event, viewport) => {
        if (viewport) setZoom(viewport.zoom);
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isTyping = isEditingText || isTextEditingElement(document.activeElement) || isTextEditingElement(e.target);
            if (isTyping && !(e.ctrlKey || e.metaKey)) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveWorkflowManually(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }

            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'v': setActiveTool('select'); break;
                    case 'h': setActiveTool('hand'); break;
                    case 'c': setActiveTool('comment'); break;
                    case 'escape': setActiveTool('select'); break;
                    case 'x': if (canEdit) setActiveTool('scissors'); break;
                    case 'a': if (canEdit) setActiveTool('material'); break;
                    default: break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveWorkflowManually, handleUndo, handleRedo]);

    // Graph Interaction
    const onDrop = useCallback((e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('application/reactflow');
        if (!type) return;

        const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const nodeId = `${Date.now()}`;
        workflow.addNode({
            id: nodeId,
            type,
            position: pos,
            draggable: type !== 'comment',
            data: {
                label: `${type}`,
                nodeType: type,
                isPending: type === 'comment',
                onCancel: type === 'comment' ? () => deleteNode(nodeId) : undefined
            }
        });
        setActiveTool('select');
    }, [reactFlowInstance, workflow, setActiveTool]);

    const onNodeContextMenu = useCallback((event, node) => {
        if (!canEdit) return;
        event.preventDefault();
        const pane = reactFlowWrapper.current.getBoundingClientRect();
        setMenu({
            id: node.id,
            top: event.clientY < pane.height - 200 ? event.clientY : event.clientY - 200,
            left: event.clientX < pane.width - 200 ? event.clientX : event.clientX - 200,
        });
    }, [setMenu, canEdit]);

    const onPaneClick = useCallback((e) => {
        setMenu(null);
        if (activeTool === 'comment') {
            const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
            const nodeId = `${Date.now()}`;
            workflow.addNode({
                id: nodeId,
                type: 'comment',
                position: pos,
                data: {
                    label: 'New Comment',
                    isPending: true,
                    onCancel: () => deleteNode(nodeId)
                }
            });
            setActiveTool('select');
        }
    }, [activeTool, reactFlowInstance, workflow, setActiveTool]);

    const insertNodeAtCenter = (type) => {
        const viewport = reactFlowInstance.getViewport();
        const pos = {
            x: (-viewport.x + window.innerWidth / 2) / viewport.zoom,
            y: (-viewport.y + window.innerHeight / 2) / viewport.zoom,
        };
        const nodeId = `${Date.now()}`;
        workflow.addNode({
            id: nodeId,
            type,
            position: pos,
            data: {
                label: type,
                isPending: type === 'comment',
                onCancel: type === 'comment' ? () => deleteNode(nodeId) : undefined
            }
        });
        setActiveTool('material' === activeTool ? 'select' : activeTool);
    };
    const onNodeClick = useCallback((e, node) => {
        setMenu(null);
        if (activeTool === 'eraser' && canEdit) deleteNode(node.id);
    }, [activeTool, deleteNode, canEdit]);

    const onEdgeClick = useCallback((e, edge) => {
        if (activeTool === 'eraser' && canEdit) {
            e.preventDefault();
            e.stopPropagation();
            deleteEdge(edge.id);
        }
    }, [activeTool, deleteEdge, canEdit]);

    const onEdgesChangeWrapper = useCallback((changes) => {
        // Find deleted edges and delete them on backend
        const removed = changes.filter(c => c.type === 'remove');
        for (const r of removed) {
            deleteEdge(r.id);
        }
        onEdgesChange(changes);
    }, [onEdgesChange, deleteEdge]);

    const onNodesChangeWrapper = useCallback((changes) => {
        if (!canEdit) {
            const allowedChanges = changes.filter(c => c.type === 'select');
            if (allowedChanges.length > 0) {
                onNodesChange(allowedChanges);
            }
        } else {
            onNodesChange(changes);
        }
    }, [canEdit, onNodesChange]);

    const isValidConnection = useCallback((connection) => {
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);
        if (!sourceNode || !targetNode || sourceNode.id === targetNode.id) return false;

        if (sourceNode.type === 'comment' || targetNode.type === 'comment') return false;

        const h = connection.targetHandle || '';
        const st = sourceNode.type;
        const sat = sourceNode.data?.assetType || 'image';

        // Cegah double connection pada handle yang sama
        const isAlreadyConnected = edges.some(e => e.target === connection.target && e.targetHandle === h);
        if (isAlreadyConnected) return false;

        // 1. Handle Teks / Prompt
        if (h.includes('prompt') || h.includes('text')) {
            if (st === 'wan_input' || st === 'input') return sat === 'text';
            return ['prompt', 'text', 'qwen_text', 'text_to_speech'].includes(st);
        }

        // 2. Handle Gambar / Frame (ref-image, first-frame, etc)
        if (h.includes('image') || h.includes('frame')) {
            if (st === 'wan_input' || st === 'input') return sat === 'image';
            return ['wan_image_t2i', 'wan_image_edit', 'wan_image'].includes(st);
        }

        // 3. Handle Video (ref-video)
        if (h.includes('video')) {
            // Kita ijinkan gambar masuk ke slot video jika user butuh (e.g. untuk reference)
            if (st === 'wan_input' || st === 'input') return sat === 'video' || sat === 'image';
            return [
                'wan_video_t2v', 'wan_video_i2v', 'wan_video_r2v', 'wan_video_ifi', 'wan_video',
                'wan_image_t2i', 'wan_image_edit', 'wan_image'
            ].includes(st);
        }

        // 4. Handle Audio
        if (h.includes('audio')) {
            if (st === 'wan_input' || st === 'input') return sat === 'audio';
            return st === 'text_to_speech';
        }
        return true;
    }, [nodes, edges]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-base-100">
            <span className="loading loading-spinner text-primary"></span>
        </div>
    );

    const editorCursor = TOOL_CURSOR[activeTool] || 'default';

    return (
        <div className="flex flex-col h-full min-h-screen">
            <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${darkMode ? 'bg-[#0f0f12]' : 'bg-slate-50'}`}>
                <Topbar
                    breadcrumbs={[
                        { label: 'Project', onClick: () => navigate('/dashboard') },
                        { label: 'Workspace', onClick: () => navigate('/workflows') },
                        { label: workflowName || 'Workflow Editor' },
                    ]}
                    showDefaultSearch={false}
                    editable={true}
                    onEdit={setWorkflowName}
                    editLabel={workflowName}
                    canEdit={canEdit}
                >
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold opacity-40 mr-2 tabular-nums">
                            {!canEdit ? 'View Only' : autoSaving ? 'Auto-saving...' : lastAutoSavedAt ? `Saved ${lastAutoSavedAt.toLocaleTimeString()}` : 'Ready'}
                        </span>
                        {canEdit && (
                            <button onClick={saveWorkflowManually} disabled={saving} className="btn btn-ghost btn-xs h-8 rounded-xl gap-1.5 font-bold hover:bg-base-200">
                                {saving ? <span className="loading loading-spinner loading-xs" /> : <Save size={14} />} Save
                            </button>
                        )}
                        {isOwner && (
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="btn btn-primary btn-xs h-8 font-bold px-4 ml-2 shadow-lg shadow-primary/20"
                            >
                                <Share2 size={12} /> Share
                            </button>
                        )}
                    </div>
                </Topbar>

                <div ref={reactFlowWrapper} className={`flex-1 relative overflow-hidden tool-mode-${activeTool}`} style={{ cursor: editorCursor }}>
                    <EditorToolbar activeTool={activeTool} setActiveTool={setActiveTool} onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo} canEdit={canEdit} />

                    <MaterialPanel
                        isOpen={activeTool === 'material'}
                        onClose={() => setActiveTool('select')}
                        onDragStart={(e, type) => e.dataTransfer.setData('application/reactflow', type)}
                        onInsertNode={insertNodeAtCenter}
                    />
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                            onNodesChange={onNodesChangeWrapper}
                            onEdgesChange={canEdit ? onEdgesChangeWrapper : undefined}
                            onConnect={canEdit ? onConnect : undefined}
                            onReconnect={canEdit ? workflow.onReconnect : undefined}
                            onNodeClick={onNodeClick}
                            onEdgeClick={onEdgeClick}
                            onPaneClick={onPaneClick}
                            onNodeContextMenu={onNodeContextMenu}
                            onDrop={canEdit ? onDrop : undefined}
                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                            nodeTypes={nodeTypes}
                        onMoveEnd={onMoveEnd}
                        panOnDrag={activeTool === 'hand' ? [0, 1] : [1]}
                        fitView
                        onlyRenderVisibleElements={true}
                        minZoom={0.1}
                        maxZoom={4}
                        isValidConnection={isValidConnection}
                        connectionLineType={ConnectionLineType.Bezier}
                        connectionLineStyle={{ stroke: 'rgba(99, 102, 241, 0.45)', strokeWidth: 2 }}
                        proOptions={{ hideAttribution: true }}
                        elementsSelectable={activeTool === 'select' || activeTool === 'comment'}
                        nodesConnectable={canEdit && activeTool === 'select'}
                        nodesDraggable={canEdit && activeTool === 'select'}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={24} size={2} className="opacity-20" />
                        <MiniMap
                            nodeColor={(node) => {
                                const palette = NODE_PALETTE.find(n => n.type === node.type);
                                return palette ? 'rgb(99, 102, 241)' : '#94a3b8';
                            }}
                            className="!bg-base-100/50 !border-base-300/40 !rounded-2xl !shadow-2xl !backdrop-blur-xl"
                            maskColor="rgba(0, 0, 0, 0.1)"
                        />
                    </ReactFlow>

                    <ZoomControls zoom={zoom} onZoomIn={() => reactFlowInstance.zoomIn()} onZoomOut={() => reactFlowInstance.zoomOut()} onZoomSet={(l) => reactFlowInstance.zoomTo(l)} onFitView={() => reactFlowInstance.fitView()} />

                    <NodeContextMenu
                        menu={menu}
                        setMenu={setMenu}
                        renameNode={renameNode}
                        duplicateNode={duplicateNode}
                        deleteNode={deleteNode}
                    />
                </div>
            </div>

            {
                toast && (
                    <div className="toast toast-end toast-bottom z-[100] p-6 animate-in slide-in-from-bottom-5">
                        <div className={`alert max-w-5xl text-wrap text-xs font-bold rounded-xl shadow-2xl border-none ${toast.type === 'success' ? 'bg-success text-success-content' : 'bg-error text-error-content'}`}>
                            {toast.msg}
                        </div>
                    </div>
                )
            }

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareId={shareId}
                sharePermission={sharePermission}
                onUpdatePermission={updateSharePermission}
            />
        </div >
    );
};

const WorkflowEditorPage = () => {
    const { id: workflowId } = useParams();
    const navigate = useNavigate();
    
    // Update recent workflow when opening
    useEffect(() => {
        if (workflowId) {
            localStorage.setItem('recent_workflow_id', workflowId);
        }
    }, [workflowId]);

    return (
        <ReactFlowProvider>
            <InnerWorkflowEditor />
        </ReactFlowProvider>
    );
};

export default WorkflowEditorPage;
