import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { PageTitleHeader } from "@/components/layout/page-title-header";
import { memo, useCallback, useMemo } from "react";

export const Header = memo(function Header() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const userName = user?.username || "";
  
  // Mémoriser les initiales pour éviter les recalculs
  const userInitials = useMemo(() => {
    return getInitials(userName.split("@")[0]);
  }, [userName]);

  return (
    /* Utilisez le nouveau composant PageTitleHeader exactement comme dans la capture d'écran */
    <PageTitleHeader 
      showNotifications={true}
      showSearch={false}
      username={userName}
      userInitials={userInitials}
      userAvatar={user?.avatar ? user.avatar : undefined}
      onLogout={handleLogout}
    />
  );
});
