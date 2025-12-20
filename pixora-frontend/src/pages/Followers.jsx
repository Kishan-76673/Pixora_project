import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { followService } from '../services/followService';
import { useAuthStore } from '../store/authStore';

const Followers = () => {
    const { username } = useParams();
    const { user: currentUser } = useAuthStore() || {};
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFollowers = async () => {
            const data = await followService.getFollowers(username);
            //   setFollowers(data);
            // setFollowers(Array.isArray(data) ? data : []);
            setFollowers(Array.isArray(data.results) ? data.results : []);
            setLoading(false);
        };
        loadFollowers();
    }, [username]);

    if (loading) return <p className="text-center mt-4">Loading followers...</p>;

    return (
        <div className="container mt-4">
            <h4>Followers</h4>

            {followers.length === 0 && (
                <p className="text-muted">No followers yet</p>
            )}

            {followers.map(user => (
                <div key={user.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                    <img
                        src={user.avatar_url || "/default-avatar.png"}
                        alt={user.username}
                        className="rounded-circle me-3"
                        style={{ width: 44, height: 44, objectFit: "cover" }}
                    />
                    <Link to={`/profile/${user.username}`} className="text-decoration-none">
                        <strong>{user.username}</strong>
                    </Link>

                    {currentUser?.username !== user.username && (
                        <Link to={`/profile/${user.username}`} className="btn btn-sm btn-outline-primary">
                            View
                        </Link>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Followers;
