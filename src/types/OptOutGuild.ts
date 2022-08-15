export interface OptOutGuild {
    /** Discord guild ID. */
    id: string;

    /** User ID of guild owner or admin who made this request. */
    optedOutBy: string;

    /** Site moderator who facilitated this request. */
    doneBy: string;

    doneAt: string;
}
