import { FileText, LockKeyhole, Search, X, Archive, ChevronDown, ChevronRight, Folder as FolderIcon, Grid, Pencil, Plus, Settings, Trash2, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Folder } from '../types';
import { Brand } from './Brand';
import { buildFolderTree, canNestUnder, reorderSiblingIds, TreeNode } from '../utils/folderTree';

interface SidebarProps {
  folders: Folder[];
  noteCount?: number;
  preview?: boolean;
  selectedFolderId: string;
  onSelectFolder: (id: string) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onReparentFolder: (id: string, newParentId: string | null) => void;
  onReorderFolders: (folderIds: string[], sortOrders: number[]) => void;
  onMoveNote: (noteId: string, newFolderId: string | null) => void;
  onOpenSettings?: () => void;
  /** Opens the "Shared With Me" discovery modal (see SharedNotebooksModal) - optional so
   *  Sidebar doesn't hard-require it from every caller/test. */
  onOpenSharedWithMe?: () => void;
  isOpen: boolean;
  /** Mobile-only: closes the drawer overlay (tapping the backdrop). No-op/unused on desktop, where the sidebar is static. */
  onClose?: () => void;
  /** True when viewing a shared notebook with a READ-only grant - hides folder create/rename/
   *  delete affordances and disables all folder/note drag-and-drop. Navigation (select folder,
   *  Trash, expand/collapse, Settings, Shared with me) stays fully available. Default false =
   *  all existing behavior. */
  readOnly?: boolean;
}

const EXPANDED_STORAGE_KEY = 'inkblob_sidebar_expanded';
const FOLDER_DRAG_TYPE = 'application/x-inkblob-folder';
const NOTE_DRAG_TYPE = 'application/x-inkblob-note';

function loadExpanded(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(EXPANDED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'file-text': return <FileText size={16} />;
    case 'trash': return <Trash2 size={16} />;
    case 'archive': return <Archive size={16} />;
    case 'smart': return <Grid size={16} />;
    default: return <FolderIcon size={16} />;
  }
};

interface DragState {
  folderId: string;
  currentParentId: string | null;
}

interface FolderListProps {
  nodes: TreeNode[];
  parentId: string | null;
  depth: number;
  folders: Folder[];
  selectedFolderId: string;
  expanded: Record<string, boolean>;
  toggleExpanded: (id: string) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  drag: DragState | null;
  setDrag: (d: DragState | null) => void;
  dropTargetId: string | null;
  setDropTargetId: (id: string | null) => void;
  props: SidebarProps;
}

const DropIndicator: React.FC<{
  active: boolean;
  onDrop: (e: React.DragEvent) => void;
}> = ({ active, onDrop }) => {
  const [hovering, setHovering] = useState(false);
  return (
    <div
      className="relative h-1.5 -my-0.5"
      onDragOver={(e) => { if (active) { e.preventDefault(); setHovering(true); } }}
      onDragLeave={() => setHovering(false)}
      onDrop={(e) => { e.preventDefault(); setHovering(false); if (active) onDrop(e); }}
    >
      {active && hovering && (
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-web3-primary" />
      )}
    </div>
  );
};

const FolderList: React.FC<FolderListProps> = ({
  nodes, parentId, depth, folders, selectedFolderId, expanded, toggleExpanded,
  renamingId, setRenamingId, drag, setDrag, dropTargetId, setDropTargetId, props,
}) => {
  // afterIndex is a position in the original `nodes` array (-1 = insert before everything).
  const reorderWithinThisList = (draggedId: string, afterIndex: number) => {
    const ids = reorderSiblingIds(nodes.map(n => n.id), draggedId, afterIndex);
    props.onReorderFolders(ids, ids.map((_, i) => i));
  };

  return (
    <ul>
      <DropIndicator
        active={!props.readOnly && !!drag && drag.currentParentId === parentId}
        onDrop={(e) => {
          if (props.readOnly || !drag) return;
          const draggedId = e.dataTransfer.getData(FOLDER_DRAG_TYPE) || drag.folderId;
          reorderWithinThisList(draggedId, -1); // -1 = insert before everything
          setDrag(null);
        }}
      />
      {nodes.map((node, index) => (
        <React.Fragment key={node.id}>
          <FolderRow
            node={node}
            parentId={parentId}
            depth={depth}
            folders={folders}
            selectedFolderId={selectedFolderId}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            renamingId={renamingId}
            setRenamingId={setRenamingId}
            drag={drag}
            setDrag={setDrag}
            dropTargetId={dropTargetId}
            setDropTargetId={setDropTargetId}
            props={props}
          />
          <DropIndicator
            active={!props.readOnly && !!drag && drag.currentParentId === parentId && drag.folderId !== node.id}
            onDrop={(e) => {
              if (props.readOnly || !drag) return;
              const draggedId = e.dataTransfer.getData(FOLDER_DRAG_TYPE) || drag.folderId;
              reorderWithinThisList(draggedId, index + 1);
              setDrag(null);
            }}
          />
        </React.Fragment>
      ))}
    </ul>
  );
};

const FolderRow: React.FC<{
  node: TreeNode;
  parentId: string | null;
  depth: number;
  folders: Folder[];
  selectedFolderId: string;
  expanded: Record<string, boolean>;
  toggleExpanded: (id: string) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  drag: DragState | null;
  setDrag: (d: DragState | null) => void;
  dropTargetId: string | null;
  setDropTargetId: (id: string | null) => void;
  props: SidebarProps;
}> = ({ node, parentId, depth, folders, selectedFolderId, expanded, toggleExpanded, renamingId, setRenamingId, drag, setDrag, dropTargetId, setDropTargetId, props }) => {
  const [renameValue, setRenameValue] = useState(node.name);
  const isExpanded = expanded[node.id] ?? true;
  const hasChildren = node.children.length > 0;
  const isRenaming = renamingId === node.id;
  const isBeingDragged = drag?.folderId === node.id;
  const isDropTarget = dropTargetId === node.id;

  useEffect(() => { setRenameValue(node.name); }, [node.name, isRenaming]);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== node.name) props.onRenameFolder(node.id, trimmed);
    setRenamingId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);

    const draggedNoteId = e.dataTransfer.getData(NOTE_DRAG_TYPE);
    if (draggedNoteId) {
      props.onMoveNote(draggedNoteId, node.id);
      return;
    }

    const draggedFolderId = e.dataTransfer.getData(FOLDER_DRAG_TYPE) || drag?.folderId;
    if (!draggedFolderId || draggedFolderId === node.id) { setDrag(null); return; }

    const check = canNestUnder(folders, draggedFolderId, node.id);
    if (!check.allowed) {
      setDrag(null);
      return;
    }
    props.onReparentFolder(draggedFolderId, node.id);
    setDrag(null);
  };

  return (
    <li>
      <div
        draggable={!props.readOnly}
        onDragStart={(e) => {
          if (props.readOnly) return;
          e.dataTransfer.setData(FOLDER_DRAG_TYPE, node.id);
          e.dataTransfer.effectAllowed = 'move';
          // Use the list's resolved parentId, not node.parentId directly - buildFolderTree treats
          // a dangling/deleted parent reference as root, and drag state must agree with that same
          // resolution or reorder-within-list's currentParentId check never matches.
          setDrag({ folderId: node.id, currentParentId: parentId });
        }}
        onDragEnd={() => { setDrag(null); setDropTargetId(null); }}
        onDragOver={(e) => {
          if (props.readOnly) return;
          e.preventDefault();
          e.stopPropagation();
          if (drag && drag.folderId === node.id) return;
          setDropTargetId(node.id);
        }}
        onDragLeave={() => { if (isDropTarget) setDropTargetId(null); }}
        onDrop={props.readOnly ? undefined : handleDrop}
        className={`group relative w-full flex items-center px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${selectedFolderId === node.id
          ? 'bg-web3-primary/20 text-web3-primary'
          : 'text-web3-textMuted hover:bg-web3-cardHover hover:text-web3-text'
          } ${isBeingDragged ? 'opacity-40' : ''} ${isDropTarget ? 'ring-1 ring-web3-primary bg-web3-primary/10' : ''}`}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        <button
          onClick={() => toggleExpanded(node.id)}
          className={`mr-0.5 p-0.5 rounded hover:bg-web3-cardHover/60 ${hasChildren ? '' : 'invisible'}`}
          aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="flex items-center flex-1 min-w-0 gap-2 text-left">
          <span className={selectedFolderId === node.id ? 'text-web3-primary' : 'text-web3-textMuted'}>
            {getIcon(node.icon)}
          </span>
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenamingId(null);
              }}
              className="flex-1 min-w-0 bg-web3-bg/60 rounded px-1 py-0.5 text-sm text-web3-text outline-none border border-web3-primary/40"
            />
          ) : (
            <button onClick={() => props.onSelectFolder(node.id)} aria-current={selectedFolderId === node.id ? 'page' : undefined} className="truncate text-left flex-1">{node.name}</button>
          )}
        </div>

        {!isRenaming && !props.readOnly && (
          <div className="folder-actions hidden group-hover:flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); props.onCreateFolder?.(node.id); }}
              title="New subfolder"
              aria-label="New subfolder"
              className="p-1 rounded hover:bg-web3-cardHover/80 hover:text-web3-primary"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setRenamingId(node.id); }}
              title="Rename"
              aria-label="Rename folder"
              className="p-1 rounded hover:bg-web3-cardHover/80 hover:text-web3-primary"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); props.onDeleteFolder(node.id); }}
              title="Delete folder"
              aria-label="Delete folder"
              className="p-1 rounded hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <FolderList
          nodes={node.children}
          parentId={node.id}
          depth={depth + 1}
          folders={folders}
          selectedFolderId={selectedFolderId}
          expanded={expanded}
          toggleExpanded={toggleExpanded}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
          drag={drag}
          setDrag={setDrag}
          dropTargetId={dropTargetId}
          setDropTargetId={setDropTargetId}
          props={props}
        />
      )}
    </li>
  );
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const { folders, selectedFolderId, onSelectFolder, onCreateFolder, onOpenSettings, onOpenSharedWithMe, isOpen, onClose, onMoveNote, readOnly = false } = props;

  const [expanded, setExpanded] = useState<Record<string, boolean>>(loadExpanded);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [rootIsDropTarget, setRootIsDropTarget] = useState(false);

  useEffect(() => {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(expanded));
  }, [expanded]);

  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const tree = useMemo(() => buildFolderTree(folders.filter(folder => folder.type === 'user')), [folders]);

  const systemFolders = folders.filter(f => f.type === 'system' && f.id !== 'trash');

  if (!isOpen) return null;

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setRootIsDropTarget(false);
    // Read-only shared mode: all drag sources are disabled, but refuse drops anyway.
    if (readOnly) return;

    const draggedNoteId = e.dataTransfer.getData(NOTE_DRAG_TYPE);
    if (draggedNoteId) {
      onMoveNote(draggedNoteId, null);
      return;
    }

    const draggedFolderId = e.dataTransfer.getData(FOLDER_DRAG_TYPE) || drag?.folderId;
    if (draggedFolderId) {
      props.onReparentFolder(draggedFolderId, null);
    }
    setDrag(null);
  };

  return (
    <>
      <button className="sidebar-backdrop lg:hidden" onClick={onClose} aria-label="Close sidebar" />
      <aside className="workspace-sidebar" aria-label="Notebook navigation">
        <div className="sidebar-brand"><Brand /><button onClick={onClose} className="icon-button lg:hidden" aria-label="Close sidebar"><X size={17} /></button></div>
        <div className="workspace-switcher"><span className="workspace-avatar">M</span><div><strong>My workspace</strong><span>{props.preview ? 'Preview notebook' : 'Personal notebook'}</span></div><LockKeyhole size={13} /></div>
        <button className="sidebar-search" onClick={() => document.dispatchEvent(new CustomEvent('inkblob:search'))}><Search size={16} /><span>Quick search</span><kbd>⌘ K</kbd></button>
        <nav className="sidebar-system" aria-label="Notes">
          {systemFolders.map(folder => <button key={folder.id} onClick={() => onSelectFolder(folder.id)}
            aria-current={selectedFolderId === folder.id ? 'page' : undefined}
            className={`sidebar-nav-item ${selectedFolderId === folder.id ? 'is-active' : ''}`}>
            {getIcon(folder.icon)}<span>{folder.name}</span>{props.noteCount != null && <span className="nav-count">{props.noteCount}</span>}
          </button>)}
        </nav>
        <div className="sidebar-library custom-scrollbar" onDragOver={e => { if (drag) { e.preventDefault(); setRootIsDropTarget(true); } }}
          onDragLeave={e => { if (e.currentTarget === e.target) setRootIsDropTarget(false); }} onDrop={handleRootDrop}>
          <div className="sidebar-section-heading"><h3>Library</h3>{!readOnly && <button onClick={() => onCreateFolder?.(null)} title="New folder" aria-label="New folder" className="icon-button"><Plus size={15} /></button>}</div>
          <FolderList nodes={tree} parentId={null} depth={0} folders={folders} selectedFolderId={selectedFolderId}
            expanded={expanded} toggleExpanded={toggleExpanded} renamingId={renamingId} setRenamingId={setRenamingId}
            drag={drag} setDrag={setDrag} dropTargetId={dropTargetId} setDropTargetId={setDropTargetId} props={props} />
          {tree.length === 0 && <p className="sidebar-folder-hint">A little order for your ideas.<br />Create your first folder above.</p>}
          {drag && <div className={`mt-2 h-10 rounded-lg border border-dashed flex items-center justify-center text-xs ${rootIsDropTarget ? 'border-web3-primary text-web3-primary bg-web3-primary/10' : 'border-web3-border text-web3-textMuted'}`}>Drop here to move to root</div>}
        </div>
        <div className="sidebar-bottom">
          {onOpenSharedWithMe && <button onClick={onOpenSharedWithMe} className="sidebar-nav-item"><Users size={16} /><span>Shared with me</span></button>}
          {folders.some(f => f.id === 'trash') && <button onClick={() => onSelectFolder('trash')} aria-current={selectedFolderId === 'trash' ? 'page' : undefined}
            className={`sidebar-nav-item ${selectedFolderId === 'trash' ? 'is-active' : ''}`}><Trash2 size={16} /><span>Trash</span></button>}
          <button onClick={onOpenSettings} className="sidebar-nav-item"><Settings size={16} /><span>Settings</span></button>
          <div className="sidebar-privacy"><LockKeyhole size={14} /><div><strong>{props.preview ? 'Make yourself at home' : 'Your words, your keys'}</strong><p>{props.preview ? 'Try writing. Changes stay in this preview until you leave.' : 'Encrypted in your browser. Only you hold the keys.'}</p></div></div>
          <div className="sidebar-footnote">A home for your thoughts.</div>
        </div>
      </aside>
    </>
  );
};
