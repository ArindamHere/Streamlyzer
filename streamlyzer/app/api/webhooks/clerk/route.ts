import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const evt = await verifyWebhook(req)

        //const { id } = evt.data
        const eventType = evt.type
        //console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
        //console.log('Webhook payload:', evt.data)

        // when a user is created, we can store their information in our database
        if (eventType === 'user.created') {
            await db.user.create({
                data: {
                    externalUserId: evt.data.id, //clerk user ID
                    username: evt.data.username || '', //optional username
                    imageUrl: evt.data.image_url || '', //optional image URL
                }
            })
        }

        // when a user is updated, we can update their information in our database
        if (eventType === 'user.updated') {
            const currentUser = await db.user.findUnique({
                where: {
                    externalUserId: evt.data.id
                }
            });
            if (!currentUser) {
                return new Response('User not found', { status: 404 });
            }

            await db.user.update({
                where: {
                    externalUserId: evt.data.id
                },
                data: {
                    username: evt.data.username || '',
                    imageUrl: evt.data.image_url,
                },
            });
        }

        if (eventType === 'user.deleted') {
            await db.user.delete({
                where: {
                    externalUserId: evt.data.id //clerk user ID
                },
            });
        }


        return new Response('Webhook received', { status: 200 })
    } catch (err) {
        console.error('Error verifying webhook:', err)
        return new Response('Error verifying webhook', { status: 400 })
    }
}