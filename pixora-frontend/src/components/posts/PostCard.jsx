import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '../../services/postService';
import { useAuthStore } from '../../store/authStore';

const textColor = { color: "var(--text-color, var(--bs-body-color))" };
const textMuted = { color: "var(--text-muted-color, var(--bs-secondary-color))" };

const PostCard = ({ post, onDelete }) => {
    const { user: currentUser } = useAuthStore();
    const [liked, setLiked] = useState(post.is_liked);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);

    const handleLike = async () => {
        try {
            if (liked) {
                await postService.unlikePost(post.id);
                setLiked(false);
                setLikeCount(prev => prev - 1);
            } else {
                await postService.likePost(post.id);
                setLiked(true);
                setLikeCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const loadComments = async () => {
        if (showComments) {
            setShowComments(false);
            return;
        }

        setLoadingComments(true);
        try {
            const data = await postService.getComments(post.id);
            setComments(data);
            setShowComments(true);
        } catch (error) {
            console.error('Load comments error:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        try {
            await postService.addComment(post.id, commentText);
            setCommentText('');
            const updatedComments = await postService.getComments(post.id);
            setComments(updatedComments);
            setShowComments(true);
        } catch (error) {
            console.error('Comment error:', error);
            alert('Failed to add comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDelete = async () => {
            try {
                await postService.deletePost(post.id);
                onDelete && onDelete(post.id);
            } catch (error) {
                console.error('Delete error:', error);
                alert('Failed to delete post');
        }
    };

    const togglePlay = () => {
        const video = videoRef.current;

        if (!isPlaying) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };


    return (
        <div className="card mb-4 shadow-sm">
            {/* Post Header */}
            <div className="card-header bg-white d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--bs-card-bg)' }}>
                <Link
                    to={`/profile/${post.user.username}`}
                    className="d-flex align-items-center text-decoration-none"
                    // text-dark
                    style={{ color: 'inherit' }}
                >
                    {post.user.avatar_url ? (
                        <img
                            src={post.user.avatar_url}
                            alt={post.user.username}
                            className="rounded-circle me-2"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                            style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                            {post.user.username[0].toUpperCase()}
                        </div>)}
                    <strong
                        // className="hover-underline"
                        // style={{ color: 'var(--bs-body-color)' }}
                        style={textColor}
                    >{post.user.username}</strong>
                </Link>
                {currentUser.id === post.user.id && (
                    <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={handleDelete}
                        title="Delete post"
                    >
                        <i className="bi bi-trash"></i>
                    </button>
                )}
            </div>

            {/* Post Media - : Support for videos */}
            {post.media_type === 'video' ? (

                <div
                    className="position-relative"
                    style={{
                        backgroundColor: '#000',
                        width: "100%",
                        maxHeight: "90vh",
                        aspectRatio: "9 / 16",
                        overflow: "hidden",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: "12px"
                    }}
                >
                    <video
                        ref={videoRef}
                        playsInline
                        className="w-100 h-100"
                        style={{
                            objectFit: "cover",
                            borderRadius: "12px",
                            cursor: "pointer"
                        }}
                        muted={isMuted}
                        onClick={togglePlay}
                        onEnded={() => setIsPlaying(false)}
                    >
                        <source src={post.media_url} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <div
                        className="position-absolute top-0 start-0 m-2 px-2 py-1 rounded"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.75rem' }}
                    >
                        <i className="bi bi-play-circle me-1"></i>
                        Video
                    </div>

                    <button
                        className="btn btn-dark position-absolute bottom-0 end-0 m-3 rounded-circle"
                        style={{ width: "48px", height: "48px", opacity: 0.85 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            videoRef.current.muted = !isMuted;
                            setIsMuted(!isMuted);
                        }}
                    >
                        <i className={`bi ${isMuted ? "bi-volume-mute-fill" : "bi-volume-up-fill"} fs-4`}></i>
                    </button>

                </div>
            ) : (
                <img
                    src={post.media_url}
                    className="card-img"
                    alt="Post"
                    style={{ maxHeight: '600px', objectFit: 'cover' }}
                    onError={(e) => {
                        console.error('Image load error:', post.media_url);
                        e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                    }}
                />
            )}


            {/* Post Actions */}
            <div className="card-body">
                <div className="d-flex mb-3">
                    <button
                        className="btn btn-link p-0 me-3" style={textColor}
                        onClick={handleLike}
                        title={liked ? "Unlike" : "Like"}
                    >
                        <i className={`bi bi-heart${liked ? '-fill text-danger' : ''} fs-4`}></i>
                    </button>
                    <button

                        className="btn btn-link p-0 me-3" style={textColor}
                        onClick={loadComments}
                        title="Comments"
                    >
                        <i className="bi bi-chat fs-4"></i>
                    </button>
                </div>


                <p className="mb-2" style={textColor}><strong>{likeCount} likes</strong></p>


                {post.caption && (
                    <p className="mb-2">
                        <Link
                            to={`/profile/${post.user.username}`}

                            className="text-decoration-none fw-bold"
                            style={textColor}

                        >
                            {post.user.username}
                        </Link>{' '}

                        <span style={textColor}>{post.caption}</span>
                    </p>
                )}

                {post.comment_count > 0 && !showComments && (
                    <button
                        className="btn btn-link p-0 text-decoration-none mb-2"
                        style={textMuted}
                        onClick={loadComments}
                    >
                        View all {post.comment_count} comments
                    </button>
                )}

                <small className="d-block" style={textMuted}>
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </small>

                {showComments && (
                    <div className="mt-3 pt-3 border-top">
                        {loadingComments ? (
                            <div className="text-center">
                                <div className="spinner-border spinner-border-sm" role="status"></div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {comments.length === 0 ? (
                                        <p className="text-muted text-center small">No comments yet</p>
                                    ) : (
                                        comments.map(comment => (
                                            <div key={comment.id} className="mb-2">
                                                <Link
                                                    to={`/profile/${comment.user.username}`}
                                                    className="text-decoration-none fw-bold"
                                                    style={textColor}
                                                >
                                                    {comment.user.username}
                                                </Link>{' '}

                                                <span style={textColor}>{comment.text}</span>

                                            </div>
                                        ))
                                    )}
                                </div>

                                <form onSubmit={handleComment}>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Add a comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            disabled={submittingComment}
                                            maxLength={500}
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={submittingComment || !commentText.trim()}
                                        >
                                            {submittingComment ? (
                                                <span className="spinner-border spinner-border-sm"></span>
                                            ) : (
                                                'Post'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export default PostCard;