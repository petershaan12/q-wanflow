import React, { createContext, useContext, useMemo } from 'react';

/**
 * WorkflowContext provides shared props to all node components
 * without passing them through nodeTypes (which causes re-renders).
 */
const WorkflowContext = createContext(null);

export const WorkflowProvider = ({ children, value }) => {
    // Memoize the context value to prevent unnecessary re-renders
    const memoizedValue = useMemo(() => value, [
        value.canEdit,
        value.showToast,
        value.deleteNode,
        value.updateNodeConfig,
    ]);

    return (
        <WorkflowContext.Provider value={memoizedValue}>
            {children}
        </WorkflowContext.Provider>
    );
};

export const useWorkflowContext = () => {
    const context = useContext(WorkflowContext);
    if (!context) {
        throw new Error('useWorkflowContext must be used within a WorkflowProvider');
    }
    return context;
};

export default WorkflowContext;
