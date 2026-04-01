/**
 * API client for resource discussion threads and replies.
 */
import { Injectable } from '@angular/core';
import { DiscussionReply } from '../../shared/models/discussion-reply';
import { Observable } from 'rxjs';
import { DiscussionThread } from '../../shared/models/discussion-thread';
import { HttpClient } from '@angular/common/http';

/**
 * Service wrapper around discussion-related endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class DiscussionService {
  /** Creates the discussion service with HTTP access. */
  constructor(private http: HttpClient) {}

  /** Base API path for resource discussion endpoints. */
  protected readonly baseUrl = '/api/resources';

  /** Retrieves all discussion threads for a resource. */
  getThreads(resourceId: string): Observable<DiscussionThread[]> {
    return this.http.get<DiscussionThread[]>(`${this.baseUrl}/${resourceId}/threads`);
  }

  /** Creates a new discussion thread for a resource. */
  createThread(resourceId: string, content: string): Observable<DiscussionThread> {
    return this.http.post<DiscussionThread>(
      `${this.baseUrl}/${resourceId}/threads`,
      JSON.stringify(content),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /** Posts a reply to an existing discussion thread. */
  reply(threadId: string, content: string): Observable<DiscussionReply> {
    return this.http.post<DiscussionReply>(
      `/api/threads/${threadId}/reply`,
      JSON.stringify(content),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
