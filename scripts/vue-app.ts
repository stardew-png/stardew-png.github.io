import { API, getQueryParam } from "./api.js";

export function mountApp() {
    // @ts-ignore
    const { createApp, ref, watch, onUpdated, onMounted, computed } = Vue;

    const app = createApp({
        setup() {
            const query = ref(getQueryParam("query", ""));
            const suggestions = ref(API.allTags);
            const allImages = ref([]);
            const category = ref(undefined);

            const randomize = async () => {
                query.value = await API.getRandomTags(category.value, 5, 100);
                setLoading();
            };

            const toggleCategory = (newCategory: string) => {
                // set the category either to the new thing, or to nothing.
                if (newCategory === category.value) category.value = undefined;
                else category.value = newCategory;

                randomize();
            }

            // if it's empty to start, fill in a random one!
            if (query.value === "") randomize();

            var activeQuery = "";
            const refreshImages = async () => {
                pageIndex.value = 0;
                const currentTags = query.value.split(" ")
                    .filter((tag: string) => API.allTags.includes(tag));

                const nextQuery = currentTags.join(" ");

                if (`${nextQuery}` !== `${activeQuery}`) {
                    if (nextQuery.length !== 0) setLoading();
                    activeQuery = nextQuery;
                    nextTags.value = await API.getTagsByTags(currentTags);
                    suggestions.value = nextTags.value.map(
                        (tag: string) => [...currentTags, tag].join(" "),
                    );

                    allImages.value = await API.getImagesByTags(currentTags);
                }
            };

            const pageSize = 100;
            const pageIndex = ref(0);
            const numPages = computed(() => {
                return Math.ceil(allImages.value.length / pageSize);
            });
            const page = computed(() => {
                const images = allImages.value.slice(
                    pageIndex.value * pageSize,
                    (pageIndex.value + 1) * pageSize,
                );
                return images;
            });
            const hasNextPage = computed(() => pageIndex.value < numPages.value - 1);
            const hasPreviousPage = computed(() => pageIndex.value > 0);
            const stepPage = (delta: number) => {
                pageIndex.value += delta;
                setLoading();
                setTimeout(() => window.scrollTo(0, 0), 10);
            };
            const pageLoading = ref(false);
            var loadingTimeout: number | undefined = undefined;
            const setLoading = () => {
                pageLoading.value = true;
                if (loadingTimeout !== undefined)
                    clearTimeout(loadingTimeout);
                loadingTimeout = setTimeout(() => {
                    loadingTimeout = undefined;
                    pageLoading.value = false;
                }, 1000);
            };
            setLoading();

            const nextTags = ref([]);

            // send query when the page loads.
            refreshImages();

            watch(query, refreshImages);

            return {
                query,
                randomize,
                suggestions,
                images: page,

                nextTags,

                hasNextPage,
                hasPreviousPage,
                stepPage,
                pageIndex,
                numPages,
                pageLoading,

                categoryMessage: computed(() => {
                    if (category.value !== undefined)
                        return `Each query is guaranteed to have at least one sprite tagged as '${category.value}'.`;
                    return undefined;
                }),

                category,
                toggleCategory,
            };
        },
    });

    app.component('category-button', {
        props: ['category', 'plural'],
        template: "#category-button-template",
        setup(props: {
            category: string,
            plural: string,
        }) {
            return {
                color: computed(() => {
                    switch (props.category) {
                        case "red": return "rgb(191, 1, 1)";
                        case "orange": return "rgb(211, 81, 39)";
                        case "yellow": return "rgb(205, 151, 26)";
                        case "green": return "rgb(88, 193, 36)";
                        case "blue": return "rgb(23, 128, 213)";
                        case "purple": return "purple";
                        case "black": return "black";
                        default: return '';
                    }
                }),
            };
        }
    });
    app.mount("#app");
}

async function runScripts() {
    await API.load();
    mountApp();
}

runScripts();