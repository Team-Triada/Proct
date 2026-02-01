'use client'

import React from 'react'

export default function SubjectActionsClient({
    subject,
    isApproved
}: {
    subject: { id: string },
    isApproved: boolean
}) {
    return (
        <div className="card space-y-3">
            <h3 className="font-medium text-theme-primary">Actions</h3>
            {!isApproved && (
                <>
                    <form action={`/api/subjects/${subject.id}/approve`} method="POST">
                        <button className="btn btn-success w-full">Approve Subject</button>
                    </form>
                    <form
                        action={`/api/subjects/${subject.id}/reject`}
                        method="POST"
                        onSubmit={(e) => !confirm('Reject and delete this subject request?') && e.preventDefault()}
                    >
                        <button className="btn btn-danger w-full">Reject Request</button>
                    </form>
                </>
            )}
            {isApproved && (
                <form
                    action={`/api/subjects/${subject.id}/reject`}
                    method="POST"
                    onSubmit={(e) => !confirm('Are you sure you want to delete this subject? This will delete all associated quizzes.') && e.preventDefault()}
                >
                    <button className="btn btn-danger w-full">Delete Subject</button>
                </form>
            )}
        </div>
    )
}
