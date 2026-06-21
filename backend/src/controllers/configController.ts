import { Request, Response } from 'express';
import { z } from 'zod';
import { CustomFieldType } from '@prisma/client';
import { prisma } from '../config/database';
import { sendSuccess } from '../utils/apiResponse';

const columnSchema = z.object({
  name: z.string().min(1).max(60),
  status: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  wipLimit: z.number().int().positive().nullable().optional(),
});

const reorderSchema = z.object({ columnIds: z.array(z.string()).min(1) });

const labelSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const customFieldSchema = z.object({
  name: z.string().min(1).max(60),
  type: z.nativeEnum(CustomFieldType),
  options: z.array(z.string()).optional(),
});

export const configController = {
  // ── Columns ──
  async createColumn(req: Request, res: Response) {
    const input = columnSchema.parse(req.body);
    const count = await prisma.column.count({ where: { projectId: req.projectId! } });
    const column = await prisma.column.create({
      data: { ...input, projectId: req.projectId!, order: count },
    });
    sendSuccess(res, column, 201);
  },

  async updateColumn(req: Request, res: Response) {
    const input = columnSchema.partial().parse(req.body);
    const column = await prisma.column.update({ where: { id: req.params.columnId }, data: input });
    sendSuccess(res, column);
  },

  async reorderColumns(req: Request, res: Response) {
    const { columnIds } = reorderSchema.parse(req.body);
    await prisma.$transaction(
      columnIds.map((id, order) => prisma.column.update({ where: { id }, data: { order } }))
    );
    sendSuccess(res, { message: 'Columns reordered' });
  },

  async deleteColumn(req: Request, res: Response) {
    const count = await prisma.column.count({ where: { projectId: req.projectId! } });
    if (count <= 1) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'A project must have at least one column.' });
      return;
    }
    await prisma.column.delete({ where: { id: req.params.columnId } });
    sendSuccess(res, { message: 'Column deleted' });
  },

  // ── Labels ──
  async listLabels(req: Request, res: Response) {
    const labels = await prisma.label.findMany({ where: { projectId: req.projectId! } });
    sendSuccess(res, labels);
  },

  async createLabel(req: Request, res: Response) {
    const input = labelSchema.parse(req.body);
    const label = await prisma.label.create({ data: { ...input, projectId: req.projectId! } });
    sendSuccess(res, label, 201);
  },

  async deleteLabel(req: Request, res: Response) {
    await prisma.label.delete({ where: { id: req.params.labelId } });
    sendSuccess(res, { message: 'Label deleted' });
  },

  // ── Custom fields ──
  async listCustomFields(req: Request, res: Response) {
    const fields = await prisma.customField.findMany({ where: { projectId: req.projectId! } });
    sendSuccess(res, fields);
  },

  async createCustomField(req: Request, res: Response) {
    const input = customFieldSchema.parse(req.body);
    const field = await prisma.customField.create({
      data: {
        projectId: req.projectId!,
        name: input.name,
        type: input.type,
        options: input.options ?? [],
      },
    });
    sendSuccess(res, field, 201);
  },

  async deleteCustomField(req: Request, res: Response) {
    await prisma.customField.delete({ where: { id: req.params.fieldId } });
    sendSuccess(res, { message: 'Custom field deleted' });
  },
};
