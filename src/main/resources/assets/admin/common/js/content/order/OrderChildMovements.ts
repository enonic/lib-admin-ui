module api.content.order {

    import ReorderChildContentJson =  api.content.json.ReorderChildContentJson;

    export class OrderChildMovements {

        private reorderChildren: OrderChildMovement[] = [];

        getReorderChildren(): OrderChildMovement[] {
            return this.reorderChildren;
        }

        addChildMovement(movement: OrderChildMovement) {
            this.reorderChildren.push(movement);
        }

        toArrayJson(): ReorderChildContentJson[] {
            let result: ReorderChildContentJson[] = [];
            this.reorderChildren.forEach((movement: OrderChildMovement) => {
                result.push(movement.toJson());
            });
            return result;
        }

    }

}
