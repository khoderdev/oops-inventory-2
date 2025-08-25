import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";
import { DepartmentForm } from "@/components/department/DepartmentForm";
import { DepartmentTable } from "@/components/department/DepartmentTable";
import departmentAPI from "@/api/department.api";
import type { CreateDepartmentData, Department, DepartmentFilters, UpdateDepartmentData } from "@/types/department";
import { toast } from "@/hooks/use-toast";

export const DEFAULT_PAGE_SIZE = 10;

export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const filters: DepartmentFilters = useMemo(() => ({ page, limit, search: search || undefined, isActive }), [page, limit, search, isActive]);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await departmentAPI.getDepartments(filters);
      setDepartments(res.data.departments);
      setTotal(res.data.pagination.total);
    } catch (error: any) {
      console.error("Failed to fetch departments", error);
      toast({
        title: "Failed to load departments",
        description: error?.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setShowForm(true);
  };

  const requestDelete = (dept: Department) => {
    setDeptToDelete(dept);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async (data: CreateDepartmentData) => {
    try {
      await departmentAPI.createDepartment(data);
      toast({ title: "Department created", description: `${data.name} has been created.` });
      setShowForm(false);
      await fetchDepartments();
    } catch (error: any) {
      toast({ title: "Create failed", description: error?.message || "Unable to create department.", variant: "destructive" });
    }
  };

  const handleUpdate = async (data: UpdateDepartmentData) => {
    if (!editing) return;
    try {
      await departmentAPI.updateDepartment(editing.id, data);
      toast({ title: "Department updated", description: `${data.name ?? editing.name} has been updated.` });
      setShowForm(false);
      setEditing(null);
      await fetchDepartments();
    } catch (error: any) {
      toast({ title: "Update failed", description: error?.message || "Unable to update department.", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deptToDelete) return;
    try {
      await departmentAPI.deleteDepartment(deptToDelete.id);
      toast({ title: "Department deleted", description: `${deptToDelete.name} has been deleted.` });
      setDeleteDialogOpen(false);
      setDeptToDelete(null);
      await fetchDepartments();
    } catch (error: any) {
      toast({ title: "Delete failed", description: error?.message || "Unable to delete department.", variant: "destructive" });
    }
  };

  const handleBulkDelete = async (ids: number[]) => {
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(id => departmentAPI.deleteDepartment(id)));
      toast({ title: "Deleted", description: `${ids.length} department(s) removed.` });
      await fetchDepartments();
    } catch (error: any) {
      toast({ title: "Bulk delete failed", description: error?.message || "Some deletions may have failed.", variant: "destructive" });
      await fetchDepartments();
    }
  };

  const handleSubmitForm = async (payload: CreateDepartmentData | UpdateDepartmentData) => {
    if (editing) {
      await handleUpdate(payload as UpdateDepartmentData);
    } else {
      await handleCreate(payload as CreateDepartmentData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Add Department
        </Button>
      </div>

      <DepartmentTable
        data={departments}
        total={total}
        page={page}
        limit={limit}
        loading={loading}
        search={search}
        isActive={isActive}
        onEdit={openEdit}
        onDelete={requestDelete}
        onBulkDelete={handleBulkDelete}
        onFiltersChange={p => {
          if (p.search !== undefined) setSearch(p.search);
          if (p.isActive !== undefined || p.isActive === undefined) setIsActive(p.isActive);
          if (p.page) setPage(p.page);
        }}
        onPageChange={p => setPage(p)}
        onPageSizeChange={sz => {
          setLimit(sz);
          setPage(1);
        }}
      />

      {/* Create/Edit Modal */}
      <Dialog
        open={showForm}
        onOpenChange={open => {
          setShowForm(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="w-[95vw] max-w-[560px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-semibold">{editing ? "Edit Department" : "Add Department"}</DialogTitle>
          </DialogHeader>
          <DepartmentForm
            mode={editing ? "edit" : "create"}
            initialData={editing || undefined}
            onSubmit={handleSubmitForm}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            submitting={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deptToDelete?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DepartmentManagement;
