import { Injectable } from '@angular/core';
import { DiscussionReply } from '../../shared/models/discussion-reply';
import { Observable } from 'rxjs';
import { DiscussionThread } from '../../shared/models/discussion-thread';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DiscussionService {
  constructor(private http: HttpClient) {}

  protected readonly baseUrl = '/api/resources';

  getThreads(resourceId: string): Observable<DiscussionThread[]> {
    return this.http.get<DiscussionThread[]>(`${this.baseUrl}/${resourceId}/threads`);
  }

  createThread(resourceId: string, content: string): Observable<DiscussionThread> {
    return this.http.post<DiscussionThread>(
      `${this.baseUrl}/${resourceId}/threads`,
      JSON.stringify(content),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  reply(threadId: string, content: string): Observable<DiscussionReply> {
    return this.http.post<DiscussionReply>(
      `/api/threads/${threadId}/reply`,
      JSON.stringify(content),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
