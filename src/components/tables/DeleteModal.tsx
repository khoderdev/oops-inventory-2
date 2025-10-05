import React from "react";
import { Modal } from "@/components/pos/Modal";
import { Trash2, RefreshCw } from "lucide-react";
import { Table } from "@/types/inventory";

export interface DeleteTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  table: Table | null;
  isDeleting: boolean;
}

export const DeleteTableModal: React.FC<DeleteTableModalProps> = ({ isOpen, onClose, onConfirmDelete, table, isDeleting }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-red-600">
          <Trash2 className="w-5 h-5" />
          Delete Table
        </div>
      }
      maxWidth="max-w-md"
      showCloseButton={true}
      actions={[
        {
          label: "Cancel",
          onClick: onClose,
          variant: "secondary",
          disabled: isDeleting
        },
        {
          label: isDeleting ? "Deleting..." : "Delete",
          onClick: onConfirmDelete,
          variant: "danger",
          disabled: isDeleting,
          className: isDeleting ? "opacity-50" : ""
        }
      ]}
    >
      <div className="py-4">
        <p className="text-gray-700 mb-4">
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold">
            Table {table?.number}
            {table?.name && ` (${table.name})`}
          </span>
          ?
        </p>
        {isDeleting && (
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Deleting table...</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
