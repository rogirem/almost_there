import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', { id: text('id').primaryKey(), code: text('code').notNull().unique(), createdAt: integer('created_at').notNull(), storyVersion: integer('story_version').notNull().default(1) });
export const participants = sqliteTable('participants', { id:text('id').primaryKey(), roomId:text('room_id').notNull().references(()=>rooms.id), role:text('role').notNull(), tokenHash:text('token_hash').notNull().unique(), name:text('name').notNull(), detail:text('detail').notNull().default(''), stage:integer('stage').notNull().default(0), arrived:integer('arrived').notNull().default(0), finished:integer('finished').notNull().default(0), consent:text('consent').notNull().default('pending'), left:integer('left_session').notNull().default(0), routeJson:text('route_json').notNull().default(''), phase:text('phase').notNull().default('waiting'), currentPlace:text('current_place').notNull().default(''), dueAt:integer('due_at').notNull().default(0), replyAt:integer('reply_at').notNull().default(0), lastSeen:integer('last_seen').notNull().default(0), lastActivity:integer('last_activity').notNull().default(0), observedSignal:text('observed_signal').notNull().default('') }, t=>[uniqueIndex('room_role').on(t.roomId,t.role)]);
export const notes = sqliteTable('notes', {id:text('id').primaryKey(), roomId:text('room_id').notNull().references(()=>rooms.id), participantId:text('participant_id').notNull().references(()=>participants.id), stage:integer('stage').notNull(), place:text('place').notNull(), kind:text('kind').notNull(), body:text('body').notNull(), photoKey:text('photo_key'), replyTo:text('reply_to'), createdAt:integer('created_at').notNull()},t=>[uniqueIndex('one_note_per_stage').on(t.participantId,t.stage,t.kind).where(sql`kind <> 'reply'`)]);

export const visits = sqliteTable('visits', {
 id:text('id').primaryKey(), participantId:text('participant_id').notNull().references(()=>participants.id),
 stage:integer('stage').notNull(), place:text('place').notNull(), sourceId:text('source_id'), startedAt:integer('started_at').notNull()
},t=>[uniqueIndex('visit_stage').on(t.participantId,t.stage)]);
export const messages = sqliteTable('messages', {
 id:text('id').primaryKey(), participantId:text('participant_id').notNull().references(()=>participants.id),
 stage:integer('stage').notNull(),place:text('place').notNull(),kind:text('kind').notNull(),body:text('body').notNull(),noteId:text('note_id'),deliverAt:integer('deliver_at').notNull()
});
