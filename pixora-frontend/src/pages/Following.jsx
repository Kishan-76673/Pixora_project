import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { followService } from '../services/followService';

const Following = () => {
    const { username } = useParams();
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFollowing = async () => {
            const data = await followService.getFollowing(username);
            //   setFollowing(data);
            // setFollowing(Array.isArray(data) ? data : []);
            setFollowing(Array.isArray(data.results) ? data.results : []);
            setLoading(false);
        };
        loadFollowing();
    }, [username]);

    if (loading) return <p className="text-center mt-4">Loading following...</p>;

    return (
        <div className="container mt-4">
            <h4>Following</h4>
            {following.length === 0 && (
                <p className="text-muted">Not following anyone</p>
            )}

            {following.map(user => (
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
                </div>
            ))}
        </div>
    );
};

export default Following;
