import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNodesState, useEdgesState, addEdge, reconnectEdge } from '@xyflow/react';
import { assetService } from '../services/assetService';
import { workflowService } from '../services/workflowService';

// -- Helper functions extracted from Page --
const isPersistedId = (value) => {
    const strValue = String(value);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strValue);
};

const isLockedNodeType = (type) => type === 'comment';

const sanitizeNodeConfigForSave = (config) => {
    const { nodeData, startRename, ...rest } = config || {};
    return rest;
};

const buildWorkflowSignature = (workflowName, nodes, edges) => {
    const serializedNodes = nodes
        .filter((n) => isPersistedId(n.id))
        .map((n) => ({
            id: String(n.id),
            type: n.type,
            x: Math.round(n.position?.x ?? 0),
            y: Math.round(n.position?.y ?? 0),
            parentId: n.parentId ?? null,
            extent: n.extent ?? null,
            config: sanitizeNodeConfigForSave(n.data),
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

    const serializedEdges = edges
        .map((e) => ({
            id: String(e.id),
            source: String(e.source),
            target: String(e.target),
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

    return JSON.stringify({
        workflowName: workflowName || '',
        nodes: serializedNodes,
        edges: serializedEdges,
    });
};

export const isTextEditingElement = (element) => {
    if (!element) return false;
    return element.tagName === 'INPUT'
        || element.tagName === 'TEXTAREA'
        || element.isContentEditable;
};

export const useWorkflowEditor = (workflowId, showToast) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [workflowName, setWorkflowName] = useState('Untitled Workflow');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [lastAutoSavedAt, setLastAutoSavedAt] = useState(null);
    const [autoSaveReady, setAutoSaveReady] = useState(false);
    const [isEditingText, setIsEditingText] = useState(false);
    const [shareId, setShareId] = useState('');
    const [sharePermission, setSharePermission] = useState('private');
    const [ownerId, setOwnerId] = useState(null);
    
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    
    const lastSavedSignatureRef = useRef('');
    const signatureInitializedRef = useRef(false);
    
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const historyRef = useRef(history);
    const historyIndexRef = useRef(historyIndex);

    useEffect(() => { nodesRef.current = nodes; }, [nodes]);
    useEffect(() => { edgesRef.current = edges; }, [edges]);
    useEffect(() => { historyRef.current = history; }, [history]);
    useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

    // -- History logic --
    const pushHistory = useCallback((customNodes, customEdges) => {
        const state = { 
            nodes: JSON.parse(JSON.stringify(customNodes || nodesRef.current)), 
            edges: JSON.parse(JSON.stringify(customEdges || edgesRef.current)) 
        };
        setHistory(prev => [...prev.slice(0, historyIndexRef.current + 1), state]);
        setHistoryIndex(prev => prev + 1);
    }, []); 

    const handleUndo = useCallback(() => {
        const index = historyIndexRef.current;
        const hist = historyRef.current;
        if (index <= 0) return;
        const prevState = hist[index - 1];
        setNodes(prevState.nodes);
        setEdges(prevState.edges);
        setHistoryIndex(prev => prev - 1);
    }, [setNodes, setEdges]);

    const handleRedo = useCallback(() => {
        const index = historyIndexRef.current;
        const hist = historyRef.current;
        if (index >= hist.length - 1) return;
        const nextState = hist[index + 1];
        setNodes(nextState.nodes);
        setEdges(nextState.edges);
        setHistoryIndex(prev => prev + 1);
    }, [setNodes, setEdges]);

    // -- Load Workflow --
    useEffect(() => {
        const load = async () => {
            if (!workflowId) {
                setLoading(false);
                return;
            }
            try {
                const r = await workflowService.getWorkflow(workflowId);
                setWorkflowName(r.name);
                setShareId(r.share_id);
                setSharePermission(r.share_permission);
                setOwnerId(r.user_id);
                
                const nodesR = await workflowService.getNodes(workflowId);
                const edgesR = await workflowService.getEdges(workflowId);
                
                const finalNodes = nodesR.map(n => ({
                    id: n.id.toString(), 
                    type: n.type === 'input' ? 'wan_input' : n.type,
                    position: { x: n.position_x, y: n.position_y },
                    draggable: !isLockedNodeType(n.type),
                    data: { ...n.config, label: n.config?.label || n.type, nodeData: n },
                }));
                
                const finalEdges = edgesR.map(e => ({
                    id: e.id.toString(), 
                    source: e.source_node_id.toString(),
                    target: e.target_node_id.toString(), 
                    sourceHandle: e.source_handle,
                    targetHandle: e.target_handle,
                    animated: true,
                }));

                setNodes(finalNodes);
                setEdges(finalEdges);
                
                pushHistory(finalNodes, finalEdges); 
            } catch (err) { 
                console.error('Error loading workflow:', err); 
            } finally { 
                setLoading(false); 
            }
        };
        load();
    }, [workflowId, setNodes, setEdges]);

    // -- Auto-save readiness --
    useEffect(() => {
        if (loading) return;
        const timer = setTimeout(() => setAutoSaveReady(true), 1000);
        return () => clearTimeout(timer);
    }, [loading]);

    // -- Global Text Editing State --
    useEffect(() => {
        const updateEditingState = () => setIsEditingText(isTextEditingElement(document.activeElement));
        document.addEventListener('focusin', updateEditingState);
        document.addEventListener('focusout', updateEditingState);
        return () => {
            document.removeEventListener('focusin', updateEditingState);
            document.removeEventListener('focusout', updateEditingState);
        };
    }, []);

    // -- Signature tracking for auto-save --
    useEffect(() => {
        if (loading || signatureInitializedRef.current) return;
        lastSavedSignatureRef.current = buildWorkflowSignature(workflowName, nodes, edges);
        signatureInitializedRef.current = true;
    }, [loading, workflowName, nodes, edges]);

    // -- Auto-save logic --
    useEffect(() => {
        if (!workflowId || loading || !autoSaveReady || isEditingText) return;

        const currentSignature = buildWorkflowSignature(workflowName, nodes, edges);
        if (currentSignature === lastSavedSignatureRef.current) return;

        const timer = setTimeout(async () => {
            setAutoSaving(true);
            try {
                await workflowService.updateWorkflow(workflowId, { name: workflowName });
                
                const persistedNodes = nodes.filter((n) => isPersistedId(n.id));
                if (persistedNodes.length > 0) {
                    await Promise.all(
                        persistedNodes.map((n) =>
                            workflowService.updateNode(n.id, {
                                type: n.type,
                                position_x: Math.round(n.position?.x ?? 0),
                                position_y: Math.round(n.position?.y ?? 0),
                                config: sanitizeNodeConfigForSave(n.data),
                            })
                        )
                    );
                }

                lastSavedSignatureRef.current = currentSignature;
                setLastAutoSavedAt(new Date());
            } catch (err) {
                console.error('Error auto-saving workflow:', err);
            } finally {
                setAutoSaving(false);
            }
        }, 1800);

        return () => clearTimeout(timer);
    }, [workflowId, workflowName, nodes, loading, autoSaveReady, isEditingText, edges]);

    // -- Node & Edge Operations --
    const saveNodeToBackend = useCallback(async (node) => {
        try {
            const r = await workflowService.saveNode({
                workflow_id: workflowId, 
                type: node.type,
                position_x: Math.round(node.position.x), 
                position_y: Math.round(node.position.y),
                config: node.data,
            });
            setNodes(prev => prev.map(n => n.id === node.id ? { ...n, id: r.id.toString() } : n));
        } catch (err) {
            console.error('Error saving node:', err);
            showToast('error', 'Failed to save new node');
        }
    }, [workflowId, setNodes, showToast]);

    const deleteNode = useCallback(async (nodeId) => {
        const node = nodesRef.current.find(n => n.id === nodeId);
        if (!node) return;

        const hasGeneratedMedia = Boolean(node.data?.imageUrl || node.data?.videoUrl);
        if (hasGeneratedMedia && !window.confirm('Delete this node and its generated media asset?')) return;

        if (hasGeneratedMedia) {
            try {
                const mediaUrls = [node.data.imageUrl, node.data.videoUrl].filter(Boolean);
                const assets = await assetService.getAssets();
                const matchingAssets = (assets || []).filter((asset) => mediaUrls.includes(asset.content));
                await Promise.all(matchingAssets.map((asset) => assetService.deleteAsset(asset.id)));
            } catch (err) {
                console.error('Error deleting related assets:', err);
            }
        }

        try {
            if (isPersistedId(nodeId)) {
                await workflowService.deleteNode(nodeId);
            }
            const nextNodes = nodesRef.current.filter(n => n.id !== nodeId);
            const nextEdges = edgesRef.current.filter(e => e.source !== nodeId && e.target !== nodeId);
            setNodes(nextNodes);
            setEdges(nextEdges);
            pushHistory(nextNodes, nextEdges);
        } catch (err) {
            console.error('Error deleting node:', err);
            showToast('error', 'Failed to delete node');
        }
    }, [setNodes, setEdges, pushHistory, showToast]);
        
    const deleteEdge = useCallback(async (edgeId) => {
        try {
            if (isPersistedId(edgeId)) {
                await workflowService.deleteEdge(edgeId);
            }
            const nextEdges = edgesRef.current.filter(e => e.id !== edgeId);
            setEdges(nextEdges);
            pushHistory(null, nextEdges);
        } catch (err) {
            console.error('Error deleting edge:', err);
            showToast('error', 'Failed to delete edge');
        }
    }, [setEdges, pushHistory, showToast]);

    const onConnect = useCallback((params) => {
        // Prevent duplicate connections (same source, target, and handles)
        const isDuplicate = edgesRef.current.some(e => 
            e.source === params.source && 
            e.target === params.target && 
            e.sourceHandle === params.sourceHandle && 
            e.targetHandle === params.targetHandle
        );

        if (isDuplicate) {
            console.log('Duplicate edge prevented');
            return;
        }

        const newEdge = { 
            ...params, 
            id: `${Date.now()}`, 
            animated: true,
            // Ensure handle IDs are present for ReactFlow
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle
        };
        const nextEdges = addEdge(newEdge, edgesRef.current);
        setEdges(nextEdges);
        
        workflowService.saveEdge({
            workflow_id: workflowId,
            source_node_id: params.source,
            target_node_id: params.target,
            source_handle: params.sourceHandle,
            target_handle: params.targetHandle,
        }).then(res => {
            setEdges(prev => prev.map(e => e.id === newEdge.id ? { ...e, id: res.id.toString() } : e));
        }).catch(err => {
            console.error('Error saving edge:', err);
            showToast('error', 'Failed to save connection');
        });
        
        pushHistory(null, nextEdges);
    }, [workflowId, pushHistory, showToast]);

    const onReconnect = useCallback((oldEdge, newConnection) => {
        const nextEdges = reconnectEdge(oldEdge, newConnection, edgesRef.current);
        setEdges(nextEdges);
        
        // 1. Delete old
        if (oldEdge.id.includes('-')) {
            workflowService.deleteEdge(oldEdge.id).catch(err => console.error('Reconnect delete error:', err));
        }
        
        // 2. Save new
        workflowService.saveEdge({
            workflow_id: workflowId,
            source_node_id: newConnection.source,
            target_node_id: newConnection.target,
            source_handle: newConnection.sourceHandle,
            target_handle: newConnection.targetHandle,
        }).then(res => {
            setEdges(prev => prev.map(e => (e.source === newConnection.source && e.target === newConnection.target) ? { ...e, id: res.id.toString() } : e));
        }).catch(err => {
            console.error('Reconnect save error:', err);
        });

        pushHistory(null, nextEdges);
    }, [workflowId, pushHistory]);

    const updateNodeConfig = useCallback(async (nodeId, newConfig) => {
        const node = nodesRef.current.find(n => n.id === nodeId);
        if (!node) return;
        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...newConfig } } : n));
        
        if (isPersistedId(nodeId)) {
            try {
                await workflowService.updateNode(nodeId, {
                    type: node.type,
                    position_x: Math.round(node.position.x),
                    position_y: Math.round(node.position.y),
                    config: { ...node.data, ...newConfig },
                });
            } catch (err) {
                console.error('Error updating node config:', err);
            }
        }
    }, [setNodes]);

    const duplicateNode = useCallback(async (nodeId) => {
        const node = nodesRef.current.find(n => n.id === nodeId);
        if (!node) return;

        const newNodeId = `${Date.now()}`;
        const newNode = {
            ...node,
            id: newNodeId,
            position: {
                x: node.position.x + 40,
                y: node.position.y + 40,
            },
            selected: true,
            data: {
                ...node.data,
                label: `${node.data?.label || node.type} (Copy)`,
                nodeData: null, // Reset persisted data for the copy
            }
        };

        // Select only the new node
        setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newNode));
        
        try {
            const r = await workflowService.saveNode({
                workflow_id: workflowId,
                type: newNode.type,
                position_x: Math.round(newNode.position.x),
                position_y: Math.round(newNode.position.y),
                config: newNode.data,
            });
            setNodes(prev => prev.map(n => n.id === newNodeId ? { ...n, id: r.id.toString() } : n));
        } catch (err) {
            console.error('Error duplicating node:', err);
            showToast('error', 'Failed to duplicate node');
        }
        
        pushHistory();
    }, [workflowId, setNodes, showToast, pushHistory]);

    const renameNode = useCallback((nodeId) => {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, startRename: true } } : n));
    }, [setNodes]);

    const addNode = useCallback((newNode) => {
        const nextNodes = nodesRef.current.concat(newNode);
        setNodes(nextNodes);
        saveNodeToBackend(newNode);
        pushHistory(nextNodes);
    }, [saveNodeToBackend, pushHistory, setNodes]);

    const saveWorkflowManually = useCallback(async () => {
        setSaving(true);
        try {
            await workflowService.updateWorkflow(workflowId, { name: workflowName });
            showToast('success', 'Workflow saved');
        } catch (err) {
            console.error('Error saving workflow:', err);
            showToast('error', 'Failed to save workflow');
        } finally { 
            setSaving(false); 
        }
    }, [workflowId, workflowName, showToast]);
    
    const updateSharePermission = useCallback(async (newPermission) => {
        try {
            await workflowService.updateWorkflow(workflowId, { share_permission: newPermission });
            setSharePermission(newPermission);
            showToast('success', `Permission updated to ${newPermission}`);
        } catch (err) {
            console.error('Error updating share permission:', err);
            showToast('error', 'Failed to update share permission');
        }
    }, [workflowId, showToast]);

    return {
        nodes, edges, workflowName, loading, saving, autoSaving, lastAutoSavedAt, isEditingText,
        setNodes, setEdges, setWorkflowName,
        onNodesChange, onEdgesChange,
        handleUndo, handleRedo, canUndo, canRedo,
        deleteNode, duplicateNode, renameNode, onConnect, onReconnect, saveNodeToBackend, updateNodeConfig, saveWorkflowManually,
        addNode, deleteEdge,
        shareId, sharePermission, updateSharePermission, ownerId,
        pushHistory
    };
};
