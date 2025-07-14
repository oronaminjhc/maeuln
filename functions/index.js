const {onDocumentCreated, onDocumentWritten} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// 1. 새 댓글 생성 시 게시글 작성자에게 알림 (최신 구문으로 수정)
exports.sendCommentNotification = onDocumentCreated("posts/{postId}/comments/{commentId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        logger.log("No data associated with the event");
        return;
    }
    const commentData = snap.data();
    const postId = event.params.postId;

    // 게시글 정보 가져오기
    const postRef = admin.firestore().collection("posts").doc(postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) {
        logger.log(`Post ${postId} does not exist.`);
        return;
    }

    const postData = postSnap.data();
    const postAuthorId = postData.authorId;

    // 자기 자신에게는 알림 보내지 않음
    if (postAuthorId === commentData.authorId) {
        return;
    }

    // 알림 생성
    const notification = {
        content: `"${postData.title}" 글에 새로운 댓글이 달렸습니다.`,
        userId: postAuthorId, // 알림을 받을 사람
        link: `/post/${postId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isRead: false,
    };

    // 해당 유저의 알림 컬렉션에 추가
    const userNotificationsRef = admin.firestore()
        .collection(`users/${postAuthorId}/notifications`);
    await userNotificationsRef.add(notification);
});

// 2. 게시글 신고 10회 누적 시 자동 삭제 (최신 구문으로 수정)
exports.handlePostReport = onDocumentCreated("posts/{postId}/reports/{reportId}", async (event) => {
    const postId = event.params.postId;
    const postRef = admin.firestore().collection("posts").doc(postId);

    const reportCollectionRef = postRef.collection("reports");
    const reportSnapshot = await reportCollectionRef.get();

    // 신고 횟수가 10회 이상이면 게시글 삭제
    if (reportSnapshot.size >= 10) {
        const postSnap = await postRef.get();
        if (!postSnap.exists) {
            return;
        }
        const postData = postSnap.data();

        // 이미지 경로가 있다면 스토리지에서 이미지도 삭제
        if (postData.imagePath) {
            const bucket = admin.storage().bucket();
            await bucket.file(postData.imagePath).delete().catch((err) => {
                logger.error("Failed to delete image:", err);
            });
        }
        await postRef.delete();
    }
});

// 3. 개인 일정 시작 1시간 전 알림 (최신 구문으로 수정)
exports.scheduledEventNotifications = onSchedule("every 10 minutes", async (event) => {
    const now = admin.firestore.Timestamp.now();
    const oneHourFromNow = admin.firestore.Timestamp.fromMillis(
        now.toMillis() + (60 * 60 * 1000),
    );

    // 1시간 뒤에 시작되는 'user' 타입 이벤트 찾기
    const eventsRef = admin.firestore().collectionGroup("events");
    const query = eventsRef
        .where("type", "==", "user")
        .where("startTime", ">=", now)
        .where("startTime", "<=", oneHourFromNow);

    const querySnapshot = await query.get();

    const promises = [];
    querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        const userId = doc.ref.parent.parent.id; // users/{userId}/events

        const notification = {
            content: `일정 "${eventData.title}"이(가) 곧 시작됩니다.`,
            userId: userId,
            link: "/calendar",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
        };
        const p = admin.firestore()
            .collection(`users/${userId}/notifications`)
            .add(notification);
        promises.push(p);
    });

    await Promise.all(promises);
});