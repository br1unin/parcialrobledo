import { useState } from 'react';

import type { CategoriaNode } from '../types';

interface Props {
  nodes: CategoriaNode[];
  isAdmin: boolean;
  onEdit: (node: CategoriaNode) => void;
  onDelete: (node: CategoriaNode) => void;
}

function CategoryNode({
  node,
  isAdmin,
  onEdit,
  onDelete,
  depth,
}: {
  node: CategoriaNode;
  isAdmin: boolean;
  onEdit: (n: CategoriaNode) => void;
  onDelete: (n: CategoriaNode) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-50 group">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-5 text-slate-400 text-xs flex-shrink-0"
          disabled={!hasChildren}
        >
          {hasChildren ? (open ? '▾' : '▸') : ' '}
        </button>
        <span className="flex-1 text-sm text-slate-800">{node.nombre}</span>
        {isAdmin && (
          <span className="hidden group-hover:flex gap-1">
            <button
              onClick={() => onEdit(node)}
              className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(node)}
              className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
            >
              Eliminar
            </button>
          </span>
        )}
      </div>
      {hasChildren && open && (
        <ul className="ml-6 border-l border-slate-100">
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoryTree({ nodes, isAdmin, onEdit, onDelete }: Props) {
  if (nodes.length === 0) {
    return <p className="text-sm text-slate-400 py-4">No hay categorías todavía.</p>;
  }
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <CategoryNode key={node.id} node={node} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} depth={0} />
      ))}
    </ul>
  );
}
