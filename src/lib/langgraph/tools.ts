import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export const addActionItemTool = new DynamicStructuredTool({
  name: "add_action_item",
  description: "Add a new action item or task to a specific meeting.",
  schema: z.object({
    meetingId: z.string().describe("The ID of the meeting to add the action item to. You must always extract this from your system prompt context."),
    description: z.string().describe("The description of the action item or task."),
    assigneeName: z.string().optional().describe("The name of the person assigned to the task, if any."),
    assigneeEmail: z.string().email().optional().describe("The email address of the assignee, if known."),
  }),
  func: async ({ meetingId, description, assigneeName, assigneeEmail }) => {
    try {
      const item = await prisma.actionItem.create({
        data: {
          meetingId,
          description,
          assigneeName: assigneeName || null,
          assigneeEmail: assigneeEmail || null,
        },
      });

      // Also append the new action item to the meeting content (MoM summary)
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId }
      });
      if (meeting) {
        const appendedContent = meeting.content + `\n- [ ] **${assigneeName || "Unassigned"}**: ${description}`;
        await prisma.meeting.update({
          where: { id: meetingId },
          data: { content: appendedContent }
        });
      }

      return `Action item added successfully! Task ID: ${item.id}. If requested, you can now send an email to the assignee.`;
    } catch (error) {
      console.error("Error adding action item:", error);
      return `Failed to add action item. Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

export const sendEmailTool = new DynamicStructuredTool({
  name: "send_email",
  description: "Send an email to a specific person. Use this tool when you have an actionable item assigned to a specific person and you have their email address.",
  schema: z.object({
    to: z.string().email().describe("The email address of the recipient."),
    subject: z.string().describe("The subject of the email."),
    body: z.string().describe("The body of the email containing the action items."),
  }),
  func: async ({ to, subject, body }) => {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"MinuteFlow" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: body,
      });

      return `Email sent successfully to ${to}. Message ID: ${info.messageId}`;
    } catch (error) {
      console.error("Error sending email:", error);
      return `Failed to send email to ${to}. Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
