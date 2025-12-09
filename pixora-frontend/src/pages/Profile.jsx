import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService } from '../services/UserService';
import { postService } from '../services/postService';
import { useAuthStore } from '../store/authStore';
import { followService } from '../services/followService';

const Profile = () => {
    const { username } = useParams();
    const { user: currentUser } = useAuthStore();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const isOwnProfile = currentUser?.username === username;

    useEffect(() => {
        setProfile(null);
        setPosts([]);
        setIsFollowing(false);
        loadProfile();
        loadPosts();
    }, [username]);

    useEffect(() => {
        if (!isOwnProfile && profile) {
            checkFollowStatus();
        }
    }, [profile, isOwnProfile]);

    const loadProfile = async () => {
        try {
            setError(null);
            const data = await userService.getUserProfile(username);
            setProfile(data);
        } catch (error) {
            console.error('Load profile error:', error);
            setError('User not found');
        } finally {
            setLoading(false);
        }
    };

    const loadPosts = async () => {
        try {
            const data = await userService.getUserPosts(username);
            setPosts(data);
        } catch (error) {
            console.error('Load posts error:', error);
        }
    };

    const checkFollowStatus = async () => {
        try {
            const data = await followService.checkFollowStatus(username);
            setIsFollowing(data.is_following);
        } catch (error) {
            console.error('Check follow status error:', error);
        }
    };

    const handleFollowToggle = async () => {
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await followService.unfollowUser(username);
                setIsFollowing(false);

                // instantly update follower count
                setProfile(prev => ({
                    ...prev,
                    follower_count: Math.max(0, prev.follower_count - 1)
                }));
                // Update *your* following count safely (Zustand store)
                useAuthStore.setState(state => ({
                    user: {
                        ...state.user,
                        following_count: Math.max(0, state.user.following_count - 1)
                    }
                }));



                // If viewing your own profile, update it also
            if (isOwnProfile) {
                setProfile(prev => ({
                    ...prev,
                    following_count: Math.max(0, prev.following_count - 1)
                }));
            }
            } else {
                await followService.followUser(username);
                setIsFollowing(true);

                // instantly update follower count
                setProfile(prev => ({
                    ...prev,
                    follower_count: prev.follower_count + 1
                }));
                // Update your following count safely
                useAuthStore.setState(state => ({
                    user: {
                        ...state.user,
                        following_count: state.user.following_count + 1
                    }
                }));

              if (isOwnProfile) {
                setProfile(prev => ({
                    ...prev,
                    following_count: prev.following_count + 1
                }));
            }

            }
            // loadProfile();
        } catch (error) {
            console.error('Follow toggle error:', error);
            alert('Failed to update follow status');
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" role="status"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div className="container">
            {/* Profile Header */}
            <div className="row py-4">
                <div className="col-12">
                    <div className="d-flex align-items-center gap-4 mb-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.username}
                                    className="rounded-circle"
                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                />
                            ) : (
                                <div
                                    className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                                    style={{ width: '150px', height: '150px', fontSize: '3rem' }}
                                >
                                    {profile.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <h2 className="mb-0">{profile.username}</h2>
                                {isOwnProfile ? (
                                    <Link to="/profile/edit" className="btn btn-outline-secondary">
                                        <i className="bi bi-pencil me-2"></i>
                                        Edit Profile
                                    </Link>
                                ) : (
                                    <button
                                        className={`btn ${isFollowing ? 'btn-outline-secondary' : 'btn-primary'}`}
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                    >
                                        {followLoading ? (
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                        ) : (
                                            <i className={`bi bi-person-${isFollowing ? 'dash' : 'plus'} me-2`}></i>
                                        )}
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="d-flex gap-4 mb-3">
                                <div>
                                    <strong>{profile.post_count}</strong> posts
                                </div>
                                <div>
                                    <strong>{profile.follower_count}</strong> followers
                                </div>
                                <div>
                                    <strong>{profile.following_count}</strong> following
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                {profile.full_name && (
                                    <p className="mb-1"><strong>{profile.full_name}</strong></p>
                                )}
                                {profile.bio && (
                                    <p className="mb-1 text-muted">{profile.bio}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs - FIXED: Removed duplicate follow button */}
            <div className="border-top">
                <ul className="nav nav-tabs justify-content-center border-0">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            <i className="bi bi-grid-3x3 me-2"></i>
                            POSTS
                        </button>
                    </li>
                    {isOwnProfile && (
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'saved'
                                    ? 'active' : ''}`}
                                onClick={() => setActiveTab('saved')}
                            >
                                <i className="bi bi-bookmark me-2"></i>
                                SAVED
                            </button>
                        </li>

                    )}
                </ul>
            </div>

            {/* Posts Grid */}
            <div className="row g-2 mt-3">
                {posts.length === 0 ? (
                    <div className="col-12 text-center py-5">
                        <i className="bi bi-camera display-1 text-muted"></i>
                        <p className="text-muted mt-3">No posts yet</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="col-md-4">
                            <div
                                className="position-relative"
                                style={{ paddingBottom: '100%', cursor: 'pointer' }}
                                onClick={() => window.location.href = `/posts/${post.id}`}
                            >
                                {post.media_type === 'video' ? (
                                    <video
                                        src={post.media_url}
                                        className="position-absolute w-100 h-100"
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <img
                                        src={post.media_url}
                                        alt={post.caption}
                                        className="position-absolute w-100 h-100"
                                        style={{ objectFit: 'cover' }}
                                    />
                                )}

                                {/* Hover overlay */}
                                <div
                                    className="post-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center text-white"
                                    style={{
                                        top: 0,
                                        left: 0,
                                        background: 'rgba(0,0,0,0)',
                                        transition: 'background 0.3s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                                >
                                    <div className="d-flex gap-3">
                                        <span>
                                            <i className="bi bi-heart-fill me-1"></i>
                                            {post.like_count}
                                        </span>
                                        <span>
                                            <i className="bi bi-chat-fill me-1"></i>
                                            {post.comment_count}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Profile;