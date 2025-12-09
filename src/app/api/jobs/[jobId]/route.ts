import { llmQueryQueue } from '@/lib/queue';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;

    if (!llmQueryQueue) {
      return NextResponse.json({ error: 'Queue system not configured' }, { status: 503 });
    }

    const job = await llmQueryQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const state = await job.getState();

    return NextResponse.json({
      id: job.id,
      status: state,
      progress: job.progress || 0,
      failedReason: job.failedReason,
      data: job.data,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    });
  } catch (error) {
    console.error('Failed to fetch job status:', error);
    return NextResponse.json({ error: 'Failed to fetch job status' }, { status: 500 });
  }
}
